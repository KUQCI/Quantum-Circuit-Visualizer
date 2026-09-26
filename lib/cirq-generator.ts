import type { Circuit, Operation } from "./circuit-schema";
import {
  qubitIndexFromId,
  classicalBitIndexFromId,
} from "./circuit-schema";
import { formatParam } from "./translator-core";

export interface GenerateResult {
  success: true;
  code: string;
  warnings: string[];
}

export interface GenerateError {
  success: false;
  error: string;
}

export type CirqGenerateResult = GenerateResult | GenerateError;

function formatCirqParam(op: Operation): string {
  if (!op.parameters?.length) return "";
  return op.parameters[0].display ?? formatParam(op.parameters[0].value);
}

function qRef(index: number): string {
  return `qubits[${index}]`;
}

/** Cirq exposes gate constants in upper case (cirq.H, not cirq.h). */
const SIMPLE_GATES: Record<string, string> = {
  h: "H",
  x: "X",
  y: "Y",
  z: "Z",
  s: "S",
  t: "T",
  id: "I",
};

function emitCirqGate(op: Operation): { line: string } | { warning: string } {
  const gate = op.type;

  if (gate === "barrier") return { line: "# barrier" };

  if (gate === "measure") {
    if (!op.targets[0] || !op.classicalTargets[0]) return { warning: `measure ${op.id}: missing target` };
    const q = qubitIndexFromId(op.targets[0]);
    const c = classicalBitIndexFromId(op.classicalTargets[0]);
    return { line: `circuit.append(cirq.measure(${qRef(q)}, key='c${c}'))` };
  }

  if (gate === "reset") {
    const q = qubitIndexFromId(op.targets[0]);
    return { line: `circuit.append(cirq.reset(${qRef(q)}))` };
  }

  const simpleGate = SIMPLE_GATES[gate];
  if (simpleGate) {
    const q = qubitIndexFromId(op.targets[0]);
    return { line: `circuit.append(cirq.${simpleGate}(${qRef(q)}))` };
  }

  if (gate === "sdg") {
    const q = qubitIndexFromId(op.targets[0]);
    return { line: `circuit.append(cirq.S(${qRef(q)}) ** -1)` };
  }

  if (gate === "tdg") {
    const q = qubitIndexFromId(op.targets[0]);
    return { line: `circuit.append(cirq.T(${qRef(q)}) ** -1)` };
  }

  if (["rx", "ry", "rz"].includes(gate)) {
    const q = qubitIndexFromId(op.targets[0]);
    const p = formatCirqParam(op) || "0";
    return { line: `circuit.append(cirq.${gate}(${p}).on(${qRef(q)}))` };
  }

  if (gate === "p" || gate === "u1") {
    const q = qubitIndexFromId(op.targets[0]);
    const p = formatCirqParam(op) || "0";
    return { line: `circuit.append(cirq.ZPowGate(exponent=(${p}) / pi).on(${qRef(q)}))` };
  }

  if (gate === "cx") {
    const c = qubitIndexFromId(op.controls[0]);
    const t = qubitIndexFromId(op.targets[0]);
    return { line: `circuit.append(cirq.CNOT(${qRef(c)}, ${qRef(t)}))` };
  }

  if (gate === "cz") {
    const c = qubitIndexFromId(op.controls[0]);
    const t = qubitIndexFromId(op.targets[0]);
    return { line: `circuit.append(cirq.CZ(${qRef(c)}, ${qRef(t)}))` };
  }

  if (gate === "cy" || gate === "ch") {
    const c = qubitIndexFromId(op.controls[0]);
    const t = qubitIndexFromId(op.targets[0]);
    const base = gate === "cy" ? "Y" : "H";
    return { line: `circuit.append(cirq.${base}(${qRef(t)}).controlled_by(${qRef(c)}))` };
  }

  if (gate === "swap") {
    const q1 = qubitIndexFromId(op.targets[0]);
    const q2 = qubitIndexFromId(op.targets[1] ?? op.controls[0]);
    return { line: `circuit.append(cirq.SWAP(${qRef(q1)}, ${qRef(q2)}))` };
  }

  if (gate === "ccx") {
    const [c1, c2] = op.controls.map(qubitIndexFromId);
    const t = qubitIndexFromId(op.targets[0]);
    return { line: `circuit.append(cirq.CCX(${qRef(c1)}, ${qRef(c2)}, ${qRef(t)}))` };
  }

  if (gate === "cswap") {
    const c = qubitIndexFromId(op.controls[0]);
    const [t1, t2] = op.targets.map(qubitIndexFromId);
    return { line: `circuit.append(cirq.CSWAP(${qRef(c)}, ${qRef(t1)}, ${qRef(t2)}))` };
  }

  if (gate === "rxx" || gate === "rzz") {
    const [q1, q2] = op.targets.length === 2
      ? op.targets.map(qubitIndexFromId)
      : [qubitIndexFromId(op.controls[0]), qubitIndexFromId(op.targets[0])];
    const p = formatCirqParam(op) || "0";
    const base = gate === "rxx" ? "XX" : "ZZ";
    return {
      line: `circuit.append(cirq.${base}PowGate(exponent=(${p}) / pi, global_shift=-0.5).on(${qRef(q1)}, ${qRef(q2)}))`,
    };
  }

  return { warning: `Gate ${gate} not supported in Cirq export` };
}

export function generateCirqCode(circuit: Circuit): CirqGenerateResult {
  try {
    const n = circuit.qubits.length;
    const warnings: string[] = [];
    const lines = [
      "import cirq",
      "from numpy import pi",
      "",
      `qubits = [cirq.LineQubit(i) for i in range(${n})]`,
      "circuit = cirq.Circuit()",
      "",
    ];

    const sorted = [...circuit.operations].sort((a, b) => a.column - b.column);
    for (const op of sorted) {
      if (op.type === "barrier") {
        lines.push("# --- barrier ---");
        continue;
      }
      const emitted = emitCirqGate(op);
      if ("line" in emitted) lines.push(emitted.line);
      else warnings.push(emitted.warning);
    }

    return { success: true, code: lines.join("\n") + "\n", warnings };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cirq generation failed";
    return { success: false, error: message };
  }
}
