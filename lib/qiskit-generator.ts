/**
 * Circuit IR → clean Qiskit Python (text only).
 */
import {
  Circuit,
  Operation,
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
  warnings?: string[];
}

export type QiskitGenerateResult = GenerateResult | GenerateError;

function formatParameter(op: Operation, index = 0): string {
  if (!op.parameters || !op.parameters[index]) return "";
  const p = op.parameters[index];
  return p.display ?? formatParam(p.value);
}

function emitGateLine(op: Operation): { line: string } | { warning: string } {
  const gate = op.type;

  if (gate === "barrier") {
    if (op.targets.length === 0) return { line: "qc.barrier()" };
    const idxs = op.targets.map(qubitIndexFromId);
    if (idxs.length === 1) return { line: `qc.barrier(${idxs[0]})` };
    return { line: `qc.barrier([${idxs.join(", ")}])` };
  }

  if (gate === "measure") {
    if (!op.targets[0] || !op.classicalTargets[0]) {
      return { warning: `measure ${op.id}: missing qubit or classical target` };
    }
    const qIdx = qubitIndexFromId(op.targets[0]);
    const cIdx = classicalBitIndexFromId(op.classicalTargets[0]);
    return { line: `qc.measure(${qIdx}, ${cIdx})` };
  }

  if (gate === "reset") {
    if (!op.targets[0]) return { warning: `reset ${op.id}: missing target` };
    return { line: `qc.reset(${qubitIndexFromId(op.targets[0])})` };
  }

  if (["h", "x", "y", "z", "s", "t", "sdg", "tdg", "id", "sx", "sxdg"].includes(gate)) {
    if (!op.targets[0]) return { warning: `${gate} ${op.id}: missing target` };
    return { line: `qc.${gate}(${qubitIndexFromId(op.targets[0])})` };
  }

  if (["rx", "ry", "rz", "p"].includes(gate)) {
    if (!op.targets[0]) return { warning: `${gate} ${op.id}: missing target` };
    const param = formatParameter(op) || "0";
    return { line: `qc.${gate}(${param}, ${qubitIndexFromId(op.targets[0])})` };
  }

  if (gate === "u") {
    if (!op.targets[0]) return { warning: `u ${op.id}: missing target` };
    const theta = formatParameter(op, 0) || "pi/2";
    const phi = formatParameter(op, 1) || "0";
    const lam = formatParameter(op, 2) || "pi";
    return {
      line: `qc.u(${theta}, ${phi}, ${lam}, ${qubitIndexFromId(op.targets[0])})`,
    };
  }

  if (gate === "swap") {
    // Canvas / parser IR: two targets. Legacy: control + target.
    if (op.targets.length >= 2) {
      return {
        line: `qc.swap(${qubitIndexFromId(op.targets[0])}, ${qubitIndexFromId(op.targets[1])})`,
      };
    }
    if (op.controls[0] && op.targets[0]) {
      return {
        line: `qc.swap(${qubitIndexFromId(op.controls[0])}, ${qubitIndexFromId(op.targets[0])})`,
      };
    }
    return { warning: `swap ${op.id}: needs two qubit targets` };
  }

  if (["cx", "cz"].includes(gate)) {
    if (!op.controls[0] || !op.targets[0]) {
      return { warning: `${gate} ${op.id}: needs control and target` };
    }
    return {
      line: `qc.${gate}(${qubitIndexFromId(op.controls[0])}, ${qubitIndexFromId(op.targets[0])})`,
    };
  }

  if (["rxx", "rzz"].includes(gate)) {
    const q1 = op.controls[0] || op.targets[0];
    const q2 = op.targets.length > 1 ? op.targets[1] : op.targets[0];
    if (!q1 || !q2) return { warning: `${gate} ${op.id}: needs two qubits` };
    const param = formatParameter(op) || "pi/2";
    return {
      line: `qc.${gate}(${param}, ${qubitIndexFromId(q1)}, ${qubitIndexFromId(q2)})`,
    };
  }

  if (gate === "ccx" || gate === "rccx") {
    if (op.controls.length < 2 || !op.targets[0]) {
      return { warning: `${gate} ${op.id}: needs two controls and a target` };
    }
    return {
      line: `qc.${gate}(${qubitIndexFromId(op.controls[0])}, ${qubitIndexFromId(op.controls[1])}, ${qubitIndexFromId(op.targets[0])})`,
    };
  }

  if (gate === "rc3x") {
    if (op.controls.length < 3 || !op.targets[0]) {
      return { warning: `rc3x ${op.id}: needs three controls and a target` };
    }
    const [c1, c2, c3] = op.controls.map(qubitIndexFromId);
    return {
      line: `qc.rc3x(${c1}, ${c2}, ${c3}, ${qubitIndexFromId(op.targets[0])})`,
    };
  }

  return { warning: `Unsupported gate type for Qiskit export: ${gate}` };
}

export function generateQiskitCode(circuit: Circuit): QiskitGenerateResult {
  const warnings: string[] = [];
  try {
    const numQubits = circuit.qubits.length;
    const numClassical = circuit.classicalBits.length;

    const lines: string[] = [
      "from qiskit import QuantumCircuit",
      "",
      `qc = QuantumCircuit(${numQubits}${numClassical > 0 ? `, ${numClassical}` : ""})`,
      "",
    ];

    const sortedOps = [...circuit.operations].sort((a, b) => {
      if (a.column !== b.column) return a.column - b.column;
      return 0;
    });

    for (const op of sortedOps) {
      const emitted = emitGateLine(op);
      if ("line" in emitted) {
        lines.push(emitted.line);
      } else {
        warnings.push(emitted.warning);
      }
    }

    return { success: true, code: lines.join("\n") + "\n", warnings };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown generation error occurred";
    return { success: false, error: message, warnings };
  }
}

export function getCircuitSummary(circuit: Circuit) {
  const measureCount = circuit.operations.filter((op) => op.type === "measure").length;
  const depth = circuit.operations.length
    ? Math.max(...circuit.operations.map((op) => op.column)) + 1
    : 0;

  return {
    qubits: circuit.qubits.length,
    classicalBits: circuit.classicalBits.length,
    operations: circuit.operations.length,
    measurements: measureCount,
    depth,
  };
}
