import type { Circuit, Operation } from "./circuit-schema";
import {
  qubitIndexFromId,
  classicalBitIndexFromId,
} from "./circuit-schema";
import { formatParam } from "./translator-core";

export interface GenerateResult {
  success: true;
  code: string;
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

function emitCirqGate(op: Operation): string {
  const gate = op.type;

  if (gate === "barrier") return "# barrier";

  if (gate === "measure") {
    const q = qubitIndexFromId(op.targets[0]);
    const c = classicalBitIndexFromId(op.classicalTargets[0]);
    return `circuit.append(cirq.measure(q${q}, key='c${c}'))`;
  }

  if (gate === "reset") {
    const q = qubitIndexFromId(op.targets[0]);
    return `circuit.append(cirq.reset(q${q}))`;
  }

  if (["h", "x", "y", "z", "s", "t"].includes(gate)) {
    const q = qubitIndexFromId(op.targets[0]);
    return `circuit.append(cirq.${gate}(q${q}))`;
  }

  if (["rx", "ry", "rz"].includes(gate)) {
    const q = qubitIndexFromId(op.targets[0]);
    const p = formatCirqParam(op) || "0";
    return `circuit.append(cirq.${gate}(${p}).on(q${q}))`;
  }

  if (gate === "cx") {
    const c = qubitIndexFromId(op.controls[0]);
    const t = qubitIndexFromId(op.targets[0]);
    return `circuit.append(cirq.CNOT(q${c}, q${t}))`;
  }

  if (gate === "cz") {
    const c = qubitIndexFromId(op.controls[0]);
    const t = qubitIndexFromId(op.targets[0]);
    return `circuit.append(cirq.CZ(q${c}, q${t}))`;
  }

  if (gate === "swap") {
    const q1 = qubitIndexFromId(op.targets[0]);
    const q2 = qubitIndexFromId(op.targets[1] ?? op.controls[0]);
    return `circuit.append(cirq.SWAP(q${q1}, q${q2}))`;
  }

  throw new Error(`Gate ${gate} not supported in Cirq export`);
}

export function generateCirqCode(circuit: Circuit): CirqGenerateResult {
  try {
    const n = circuit.qubits.length;
    const lines = [
      "import cirq",
      "",
      `qubits = [cirq.LineQubit(i) for i in range(${n})]`,
      `q0, q1${n > 2 ? ", ..." : ""} = qubits[0], qubits[1]${n > 2 ? ", *qubits[2:]" : ""}`,
      "circuit = cirq.Circuit()",
      "",
    ];

    const sorted = [...circuit.operations].sort((a, b) => a.column - b.column);
    for (const op of sorted) {
      if (op.type === "barrier") {
        lines.push("# --- barrier ---");
        continue;
      }
      lines.push(emitCirqGate(op));
    }

    return { success: true, code: lines.join("\n") + "\n" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cirq generation failed";
    return { success: false, error: message };
  }
}
