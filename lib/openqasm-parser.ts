import {
  Circuit,
  Operation,
  generateOperationId,
  getGateLabel,
  qubitIdFromIndex,
  classicalBitIdFromIndex,
} from "./circuit-schema";
import {
  GATE_LIBRARY,
  Token,
  tokenize,
  evalExpr,
  formatParam,
} from "./translator-core";

export interface OpenQasmParseResult {
  success: true;
  circuit: Circuit;
}

export interface OpenQasmParseError {
  success: false;
  error: string;
}

export type ParseOpenQasmResult = OpenQasmParseResult | OpenQasmParseError;

interface QregInfo {
  name: string;
  size: number;
}

interface CregInfo {
  name: string;
  size: number;
}

class Qasm2Parser {
  private toks: Token[];
  private i = 0;
  private qregs: Map<string, QregInfo> = new Map();
  private cregs: Map<string, CregInfo> = new Map();
  private operations: Operation[] = [];
  private column = 0;

  constructor(text: string) {
    this.toks = tokenize(text);
  }

  private peek(): Token {
    return this.toks[this.i];
  }

  private advance(): Token {
    return this.toks[this.i++];
  }

  private expectSym(sym: string): Token {
    const tok = this.advance();
    if (tok.value !== sym) {
      throw new SyntaxError(`Expected '${sym}', got '${tok.value}' at pos ${tok.pos}`);
    }
    return tok;
  }

  private expectId(): string {
    const tok = this.advance();
    if (tok.kind !== "ID") {
      throw new SyntaxError(`Expected identifier, got '${tok.value}' at pos ${tok.pos}`);
    }
    return tok.value;
  }

  parse(name = "Imported Circuit"): Circuit {
    this.expectId();
    this.advance();
    if (this.peek().value === ".") {
      this.advance();
      this.advance();
    }
    this.expectSym(";");

    while (this.peek().kind === "ID" && this.peek().value === "include") {
      this.advance();
      this.advance();
      this.expectSym(";");
    }

    while (this.peek().kind !== "EOF") {
      this.statement();
    }

    const numQubits = Math.max(
      1,
      ...[...this.qregs.values()].map((r) => r.size),
      0
    );
    const numClassical = Math.max(
      0,
      ...[...this.cregs.values()].map((r) => r.size)
    );

    return {
      name,
      qubits: Array.from({ length: numQubits }, (_, i) => ({
        id: qubitIdFromIndex(i),
        label: `q[${i}]`,
      })),
      classicalBits: Array.from({ length: numClassical }, (_, i) => ({
        id: classicalBitIdFromIndex(i),
        label: `c[${i}]`,
      })),
      operations: this.operations,
    };
  }

  private statement(): void {
    const tok = this.peek();

    if (tok.kind === "SYM" && tok.value === ";") {
      this.advance();
      return;
    }

    if (tok.kind === "ID" && tok.value === "qreg") {
      this.advance();
      const regName = this.expectId();
      this.expectSym("[");
      const size = parseInt(this.advance().value, 10);
      this.expectSym("]");
      this.expectSym(";");
      this.qregs.set(regName, { name: regName, size });
      return;
    }

    if (tok.kind === "ID" && tok.value === "creg") {
      this.advance();
      const regName = this.expectId();
      this.expectSym("[");
      const size = parseInt(this.advance().value, 10);
      this.expectSym("]");
      this.expectSym(";");
      this.cregs.set(regName, { name: regName, size });
      return;
    }

    if (tok.kind === "ID" && tok.value === "barrier") {
      this.advance();
      const qubits = this.argList();
      this.expectSym(";");
      const allQubits = this.getAllQubitIds();
      this.operations.push({
        id: generateOperationId(),
        type: "barrier",
        label: "‖",
        targets: qubits.length > 0 ? qubits : allQubits,
        controls: [],
        classicalTargets: [],
        column: this.column++,
      });
      return;
    }

    if (tok.kind === "ID" && tok.value === "reset") {
      this.advance();
      const qubit = this.singleArg(false);
      this.expectSym(";");
      this.operations.push({
        id: generateOperationId(),
        type: "reset",
        label: "|0⟩",
        targets: [qubit],
        controls: [],
        classicalTargets: [],
        column: this.column++,
      });
      return;
    }

    if (tok.kind === "ID" && tok.value === "measure") {
      this.advance();
      const qubit = this.singleArg(false);
      this.expectSym("->");
      const clbit = this.singleArg(true);
      this.expectSym(";");
      this.operations.push({
        id: generateOperationId(),
        type: "measure",
        label: "M",
        targets: [qubit],
        controls: [],
        classicalTargets: [clbit],
        column: this.column++,
      });
      return;
    }

    if (tok.kind === "ID" && tok.value === "if") {
      this.advance();
      this.expectSym("(");
      this.expectId();
      this.expectSym("==");
      this.advance();
      this.expectSym(")");
      this.gateCall();
      return;
    }

    if (tok.kind === "ID") {
      this.gateCall();
      return;
    }

    throw new SyntaxError(`Unexpected token '${tok.value}' at pos ${tok.pos}`);
  }

  private gateCall(): void {
    const name = this.expectId().toLowerCase();

    const params: number[] = [];
    if (this.peek().value === "(") {
      this.advance();
      if (this.peek().value !== ")") {
        params.push(this.paramExpr());
        while (this.peek().value === ",") {
          this.advance();
          params.push(this.paramExpr());
        }
      }
      this.expectSym(")");
    }

    const qubits = this.argList();
    this.expectSym(";");

    if (!GATE_LIBRARY[name]) {
      throw new Error(
        `Gate '${name}' is not in the OpenQASM gate library. Custom gate definitions are not supported.`
      );
    }

    const gateInfo = GATE_LIBRARY[name];
    if (qubits.length !== gateInfo.nQubits) {
      throw new SyntaxError(`${name} expects ${gateInfo.nQubits} qubit(s), got ${qubits.length}`);
    }
    if (params.length !== gateInfo.nParams) {
      throw new SyntaxError(`${name} expects ${gateInfo.nParams} param(s), got ${params.length}`);
    }

    const parameters =
      params.length > 0
        ? params.map((value) => ({ value, display: formatParam(value) }))
        : undefined;

    const col = this.column++;

    if (gateInfo.nQubits === 1) {
      this.operations.push({
        id: generateOperationId(),
        type: name,
        label: getGateLabel(name),
        targets: [qubits[0]],
        controls: [],
        classicalTargets: [],
        column: col,
        parameters,
      });
      return;
    }

    if (gateInfo.nQubits === 2) {
      this.operations.push({
        id: generateOperationId(),
        type: name,
        label: getGateLabel(name),
        targets: [qubits[1]],
        controls: name === "swap" ? [] : [qubits[0]],
        classicalTargets: [],
        column: col,
        parameters,
      });
      if (name === "swap") {
        this.operations[this.operations.length - 1].targets = [qubits[0], qubits[1]];
      }
      return;
    }

    if (gateInfo.nQubits === 3) {
      this.operations.push({
        id: generateOperationId(),
        type: name,
        label: getGateLabel(name),
        targets: [qubits[2]],
        controls: [qubits[0], qubits[1]],
        classicalTargets: [],
        column: col,
        parameters,
      });
      return;
    }

    if (gateInfo.nQubits === 4) {
      this.operations.push({
        id: generateOperationId(),
        type: name,
        label: getGateLabel(name),
        targets: [qubits[3]],
        controls: [qubits[0], qubits[1], qubits[2]],
        classicalTargets: [],
        column: col,
        parameters,
      });
    }
  }

  private paramExpr(): number {
    const start = this.i;
    let depth = 0;
    while (true) {
      const tok = this.peek();
      if (tok.value === "(") depth++;
      else if (tok.value === ")") {
        if (depth === 0) break;
        depth--;
      } else if (tok.value === "," && depth === 0) break;
      else if (tok.kind === "EOF") break;
      this.advance();
    }
    const slice = this.toks.slice(start, this.i);
    return evalExpr(slice);
  }

  private resolveQubit(regName: string, index?: number): string {
    const reg = this.qregs.get(regName);
    if (!reg) throw new SyntaxError(`Unknown quantum register '${regName}'`);
    const idx = index ?? 0;
    if (idx >= reg.size) {
      throw new SyntaxError(`Qubit index ${idx} out of range for register ${regName}`);
    }
    return qubitIdFromIndex(idx);
  }

  private resolveClassical(regName: string, index?: number): string {
    const reg = this.cregs.get(regName);
    if (!reg) throw new SyntaxError(`Unknown classical register '${regName}'`);
    const idx = index ?? 0;
    if (idx >= reg.size) {
      throw new SyntaxError(`Classical index ${idx} out of range for register ${regName}`);
    }
    return classicalBitIdFromIndex(idx);
  }

  private singleArg(classical: boolean): string {
    const name = this.expectId();
    if (this.peek().value === "[") {
      this.advance();
      const idx = parseInt(this.advance().value, 10);
      this.expectSym("]");
      return classical ? this.resolveClassical(name, idx) : this.resolveQubit(name, idx);
    }
    const regs = classical ? this.cregs : this.qregs;
    const reg = regs.get(name);
    if (!reg) {
      throw new SyntaxError(`Unknown register '${name}'`);
    }
    if (reg.size === 1) {
      return classical
        ? this.resolveClassical(name, 0)
        : this.resolveQubit(name, 0);
    }
    return classical
      ? this.resolveClassical(name, 0)
      : this.resolveQubit(name, 0);
  }

  private argList(): string[] {
    const args: string[] = [];
    const first = this.singleArg(false);
    args.push(first);
    while (this.peek().value === ",") {
      this.advance();
      args.push(this.singleArg(false));
    }
    return args;
  }

  private getAllQubitIds(): string[] {
    let total = 0;
    for (const reg of this.qregs.values()) {
      total = Math.max(total, reg.size);
    }
    return Array.from({ length: total }, (_, i) => qubitIdFromIndex(i));
  }
}

export function parseOpenQasm(code: string, name = "Imported Circuit"): ParseOpenQasmResult {
  try {
    const circuit = new Qasm2Parser(code).parse(name);
    return { success: true, circuit };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown OpenQASM parse error";
    return { success: false, error: message };
  }
}
