import math
from dataclasses import dataclass, field
from fractions import Fraction
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit.circuit.library import (
    UGate, U3Gate, U2Gate, U1Gate, PhaseGate, IGate, XGate, YGate, ZGate,
    HGate, SGate, SdgGate, TGate, TdgGate, SXGate, SXdgGate,
    RXGate, RYGate, RZGate,
    CXGate, CYGate, CZGate, CHGate, SwapGate, CCXGate, CSwapGate,
    CRZGate, CU1Gate, CU3Gate, CUGate, RXXGate, RZZGate, CSXGate,
)

__all__ = ["circuit_to_qasm2", "qasm2_to_circuit"]

GATE_LIBRARY: dict[str, tuple[int, int, callable]] = {
    "id":   (1, 0, lambda p: IGate()),
    "x":    (1, 0, lambda p: XGate()),
    "y":    (1, 0, lambda p: YGate()),
    "z":    (1, 0, lambda p: ZGate()),
    "h":    (1, 0, lambda p: HGate()),
    "s":    (1, 0, lambda p: SGate()),
    "sdg":  (1, 0, lambda p: SdgGate()),
    "t":    (1, 0, lambda p: TGate()),
    "tdg":  (1, 0, lambda p: TdgGate()),
    "sx":   (1, 0, lambda p: SXGate()),
    "sxdg": (1, 0, lambda p: SXdgGate()),

    "rx":   (1, 1, lambda p: RXGate(p[0])),
    "ry":   (1, 1, lambda p: RYGate(p[0])),
    "rz":   (1, 1, lambda p: RZGate(p[0])),
    "p":    (1, 1, lambda p: PhaseGate(p[0])),
    "u1":   (1, 1, lambda p: U1Gate(p[0])),
    "u2":   (1, 2, lambda p: U2Gate(p[0], p[1])),
    "u3":   (1, 3, lambda p: U3Gate(p[0], p[1], p[2])),
    "u":    (1, 3, lambda p: UGate(p[0], p[1], p[2])),

    "cx":   (2, 0, lambda p: CXGate()),
    "cy":   (2, 0, lambda p: CYGate()),
    "cz":   (2, 0, lambda p: CZGate()),
    "ch":   (2, 0, lambda p: CHGate()),
    "swap": (2, 0, lambda p: SwapGate()),
    "csx":  (2, 0, lambda p: CSXGate()),

    "crz":  (2, 1, lambda p: CRZGate(p[0])),
    "cu1":  (2, 1, lambda p: CU1Gate(p[0])),
    "rxx":  (2, 1, lambda p: RXXGate(p[0])),
    "rzz":  (2, 1, lambda p: RZZGate(p[0])),
    "cu3":  (2, 3, lambda p: CU3Gate(p[0], p[1], p[2])),
    "cu":   (2, 4, lambda p: CUGate(p[0], p[1], p[2], p[3])),

    "ccx":   (3, 0, lambda p: CCXGate()),
    "cswap": (3, 0, lambda p: CSwapGate()),
}

# reverse lookup section, not required tbf, but helps with the export to qasm2
QISKIT_NAME_TO_QASM_NAME = {name: name for name in GATE_LIBRARY}

@dataclass
class Token:
    kind: str   # 'ID' | 'NUM' | 'STR' | 'SYM' | 'EOF'
    value: str
    pos: int


SYMBOLS = {"{", "}", "(", ")", "[", "]", ",", ";", "+", "-", "*", "/", "^",
           "==", "=", "->"}


def tokenize(text: str) -> list[Token]:
    tokens: list[Token] = []
    i, n = 0, len(text)
    while i < n:
        ch = text[i]

        if ch in " \t\r\n":
            i += 1
            continue

        if text.startswith("//", i):
            nl = text.find("\n", i)
            i = n if nl == -1 else nl + 1
            continue

        if ch == '"':
            j = text.find('"', i + 1)
            tokens.append(Token("STR", text[i + 1:j], i))
            i = j + 1
            continue

        if ch.isdigit() or (ch == "." and i + 1 < n and text[i + 1].isdigit()):
            j = i
            while j < n and (text[j].isdigit() or text[j] == "."):
                j += 1
            if j < n and text[j] in "eE":     
                j += 1
                if j < n and text[j] in "+-":
                    j += 1
                while j < n and text[j].isdigit():
                    j += 1
            tokens.append(Token("NUM", text[i:j], i))
            i = j
            continue

        if ch.isalpha() or ch == "_":
            j = i
            while j < n and (text[j].isalnum() or text[j] == "_"):
                j += 1
            tokens.append(Token("ID", text[i:j], i))
            i = j
            continue

        if text.startswith("->", i):
            tokens.append(Token("SYM", "->", i)); i += 2; continue
        if text.startswith("==", i):
            tokens.append(Token("SYM", "==", i)); i += 2; continue
        if ch in SYMBOLS:
            tokens.append(Token("SYM", ch, i)); i += 1; continue

        raise SyntaxError(f"Unexpected character {ch!r} at position {i}")

    tokens.append(Token("EOF", "", n))
    return tokens

FUNCS = {
    "sin": math.sin, "cos": math.cos, "tan": math.tan,
    "exp": math.exp, "ln": math.log, "sqrt": math.sqrt,
}


class ExprParser:
    def __init__(self, tokens: list[Token]):
        self.toks = tokens
        self.i = 0

    def _peek(self) -> Token:
        return self.toks[self.i]

    def _advance(self) -> Token:
        t = self.toks[self.i]
        self.i += 1
        return t

    def parse(self) -> float:
        value = self._expr()
        if self._peek().kind != "EOF":
            raise SyntaxError(f"Unexpected trailing token {self._peek().value!r}")
        return value

    def _expr(self) -> float:
        value = self._term()
        while self._peek().value in ("+", "-"):
            op = self._advance().value
            rhs = self._term()
            value = value + rhs if op == "+" else value - rhs
        return value

    def _term(self) -> float:
        value = self._power()
        while self._peek().value in ("*", "/"):
            op = self._advance().value
            rhs = self._power()
            value = value * rhs if op == "*" else value / rhs
        return value

    def _power(self) -> float:
        value = self._unary()
        if self._peek().value == "^":
            self._advance()
            rhs = self._power()
            value = value ** rhs
        return value

    def _unary(self) -> float:
        if self._peek().value == "-":
            self._advance()
            return -self._unary()
        if self._peek().value == "+":
            self._advance()
            return self._unary()
        return self._atom()

    def _atom(self) -> float:
        tok = self._advance()
        if tok.kind == "NUM":
            return float(tok.value)
        if tok.kind == "ID" and tok.value == "pi":
            return math.pi
        if tok.kind == "ID" and tok.value in FUNCS:
            self._expect("(")
            inner = self._expr()
            self._expect(")")
            return FUNCS[tok.value](inner)
        if tok.value == "(":
            inner = self._expr()
            self._expect(")")
            return inner
        raise SyntaxError(f"Unexpected token {tok.value!r} in expression")

    def _expect(self, sym: str):
        tok = self._advance()
        if tok.value != sym:
            raise SyntaxError(f"Expected {sym!r}, got {tok.value!r}")


def eval_expr(token_slice: list[Token]) -> float:
    return ExprParser(token_slice + [Token("EOF", "", -1)]).parse()

def format_param(value: float) -> str:
    if abs(value) < 1e-12:
        return "0"

    ratio = value / math.pi
    frac = Fraction(ratio).limit_denominator(64)
    # only trust the fraction if it actually reconstructs the value very closely to avoid precision errors and whatever, ykwim
    if abs(float(frac) - ratio) < 1e-9 * max(1.0, abs(ratio)):
        p, q = frac.numerator, frac.denominator
        sign = "-" if p < 0 else ""
        p = abs(p)
        if p == 1 and q == 1:
            return f"{sign}pi"
        if q == 1:
            return f"{sign}{p}*pi"
        if p == 1:
            return f"{sign}pi/{q}"
        return f"{sign}{p}*pi/{q}"

    text = repr(round(value, 12))
    return text.rstrip("0").rstrip(".") if "." in text else text

class Qasm2Parser:
    def __init__(self, text: str):
        self.toks = tokenize(text)
        self.i = 0
        self.qregs: dict[str, QuantumRegister] = {}
        self.cregs: dict[str, ClassicalRegister] = {}
        self.circuit: QuantumCircuit | None = None

    def _peek(self) -> Token:
        return self.toks[self.i]

    def _advance(self) -> Token:
        t = self.toks[self.i]
        self.i += 1
        return t

    def _expect_sym(self, sym: str) -> Token:
        tok = self._advance()
        if tok.value != sym:
            raise SyntaxError(f"Expected {sym!r}, got {tok.value!r} at pos {tok.pos}")
        return tok

    def _expect_id(self) -> str:
        tok = self._advance()
        if tok.kind != "ID":
            raise SyntaxError(f"Expected identifier, got {tok.value!r} at pos {tok.pos}")
        return tok.value

    def parse(self) -> QuantumCircuit:
        self._expect_id()            
        self._advance()                
        if self._peek().value == ".":
            self._advance()
            self._advance()
        self._expect_sym(";")

        while self._peek().kind == "ID" and self._peek().value == "include":
            self._advance()
            self._advance()       
            self._expect_sym(";")

        self.circuit = QuantumCircuit()

        while self._peek().kind != "EOF":
            self._statement()

        return self.circuit

    def _statement(self):
        tok = self._peek()

        if tok.kind == "SYM" and tok.value == ";":
            self._advance()          
            return

        if tok.kind == "ID" and tok.value == "qreg":
            self._advance()
            name = self._expect_id()
            self._expect_sym("[")
            size = int(self._advance().value)
            self._expect_sym("]")
            self._expect_sym(";")
            reg = QuantumRegister(size, name)
            self.qregs[name] = reg
            self.circuit.add_register(reg)
            return

        if tok.kind == "ID" and tok.value == "creg":
            self._advance()
            name = self._expect_id()
            self._expect_sym("[")
            size = int(self._advance().value)
            self._expect_sym("]")
            self._expect_sym(";")
            reg = ClassicalRegister(size, name)
            self.cregs[name] = reg
            self.circuit.add_register(reg)
            return

        if tok.kind == "ID" and tok.value == "barrier":
            self._advance()
            qubits = self._arg_list()
            self._expect_sym(";")
            self.circuit.barrier(qubits)
            return

        if tok.kind == "ID" and tok.value == "reset":
            self._advance()
            qubit = self._single_arg()
            self._expect_sym(";")
            self.circuit.reset(qubit)
            return

        if tok.kind == "ID" and tok.value == "measure":
            self._advance()
            qubit = self._single_arg()
            self._expect_sym("->")
            clbit = self._single_arg(classical=True)
            self._expect_sym(";")
            self.circuit.measure(qubit, clbit)
            return

        if tok.kind == "ID" and tok.value == "if":
            self._advance()
            self._expect_sym("(")
            creg_name = self._expect_id()
            self._expect_sym("==")
            val = int(self._advance().value)
            self._expect_sym(")")
            self._gate_call(condition=(self.cregs[creg_name], val))
            return

        if tok.kind == "ID":
            self._gate_call(condition=None)
            return

        raise SyntaxError(f"Unexpected token {tok.value!r} at pos {tok.pos}")

    def _gate_call(self, condition):
        name = self._expect_id()

        params: list[float] = []
        if self._peek().value == "(":
            self._advance()
            if self._peek().value != ")":
                params.append(self._param_expr())
                while self._peek().value == ",":
                    self._advance()
                    params.append(self._param_expr())
            self._expect_sym(")")

        qubits = self._arg_list()
        self._expect_sym(";")

        if name not in GATE_LIBRARY:
            raise NotImplementedError(
                f"Gate {name!r} is not in this translator's gate library "
                f"(custom 'gate ... {{ }}' definitions are out of scope -- "
                f"see the module docstring)."
            )

        n_qubits, n_params, builder = GATE_LIBRARY[name]
        if len(qubits) != n_qubits:
            raise SyntaxError(f"{name} expects {n_qubits} qubit(s), got {len(qubits)}")
        if len(params) != n_params:
            raise SyntaxError(f"{name} expects {n_params} param(s), got {len(params)}")

        gate = builder(params)

        if condition is None:
            self.circuit.append(gate, qubits)
        else:
            # this API is weird as hell, but that's legacy QASM2 ig
            creg, val = condition
            with self.circuit.if_test((creg, val)):
                self.circuit.append(gate, qubits)

    def _param_expr(self) -> float:
        start = self.i
        depth = 0
        while True:
            tok = self._peek()
            if tok.value in ("(",):
                depth += 1
            elif tok.value in (")",):
                if depth == 0:
                    break
                depth -= 1
            elif tok.value == "," and depth == 0:
                break
            elif tok.kind == "EOF":
                break
            self._advance()
        slice_ = self.toks[start:self.i]
        return eval_expr(slice_)

    def _single_arg(self, classical: bool = False):
        name = self._expect_id()
        regs = self.cregs if classical else self.qregs
        if self._peek().value == "[":
            self._advance()
            idx = int(self._advance().value)
            self._expect_sym("]")
            return regs[name][idx]
        return regs[name][0] if len(regs[name]) == 1 else list(regs[name])

    def _arg_list(self):
        args = []
        first = self._single_arg()
        args.extend(first if isinstance(first, list) else [first])
        while self._peek().value == ",":
            self._advance()
            nxt = self._single_arg()
            args.extend(nxt if isinstance(nxt, list) else [nxt])
        return args


def qasm2_to_circuit(qasm_str: str) -> QuantumCircuit:
    """Parse an OpenQASM 2.0 string into a Qiskit QuantumCircuit by hand."""
    return Qasm2Parser(qasm_str).parse()


def _bit_ref(circuit: QuantumCircuit, bit) -> str:
    loc = circuit.find_bit(bit)
    reg = loc.registers[0][0]   # (register, index) of the first owning register for this bit
    idx = loc.registers[0][1]
    return f"{reg.name}[{idx}]"


def _emit_gate_line(circuit: QuantumCircuit, op, qubits) -> str:
    qasm_name = QISKIT_NAME_TO_QASM_NAME.get(op.name, op.name)
    qubit_str = ",".join(_bit_ref(circuit, q) for q in qubits)
    if op.params:
        param_str = ",".join(format_param(float(p)) for p in op.params)
        return f"{qasm_name}({param_str}) {qubit_str};"
    return f"{qasm_name} {qubit_str};"


def circuit_to_qasm2(circuit: QuantumCircuit) -> str:
    """Walk circuit.data and hand-build an OpenQASM 2.0 string."""
    lines = ['OPENQASM 2.0;', 'include "qelib1.inc";', ""]

    for reg in circuit.qregs:
        lines.append(f"qreg {reg.name}[{reg.size}];")
    for reg in circuit.cregs:
        lines.append(f"creg {reg.name}[{reg.size}];")
    lines.append("")

    for instr in circuit.data:
        op = instr.operation
        qubits = instr.qubits
        clbits = instr.clbits

        if op.name == "barrier":
            qubit_str = ",".join(_bit_ref(circuit, q) for q in qubits)
            lines.append(f"barrier {qubit_str};")
            continue

        if op.name == "reset":
            lines.append(f"reset {_bit_ref(circuit, qubits[0])};")
            continue

        if op.name == "measure":
            lines.append(
                f"measure {_bit_ref(circuit, qubits[0])} -> "
                f"{_bit_ref(circuit, clbits[0])};"
            )
            continue

        if op.name == "if_else":
            true_body, false_body = op.params
            if false_body is not None or len(true_body.data) != 1:
                raise NotImplementedError(
                    "Only single-gate if-bodies (no else branch) can be "
                    "exported to OpenQASM 2.0's 'if (creg==n) gate ...;' form."
                )
            creg, val = op.condition
            inner_instr = true_body.data[0]
            inner_qubits = [qubits[true_body.find_bit(q).index] for q in inner_instr.qubits]
            inner_line = _emit_gate_line(circuit, inner_instr.operation, inner_qubits)
            lines.append(f"if ({creg.name}=={val}) {inner_line}")
            continue

        if op.name not in GATE_LIBRARY:
            raise NotImplementedError(
                f"Gate {op.name!r} is not in this translator's gate library "
                f"(see module docstring for scope)."
            )

        lines.append(_emit_gate_line(circuit, op, qubits))

    return "\n".join(lines) + "\n"