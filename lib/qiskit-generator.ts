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
}

export interface GenerateError {
  success: false;
  error: string;
}

export type QiskitGenerateResult = GenerateResult | GenerateError;

function formatParameter(op: Operation): string {
  if (!op.parameters || op.parameters.length === 0) return "";
  const display = op.parameters[0].display ?? formatParam(op.parameters[0].value);
  return display;
}

function emitGateLine(op: Operation): string {
  const gate = op.type;

  if (gate === "barrier") {
    return "qc.barrier()";
  }

  if (gate === "measure") {
    const qIdx = qubitIndexFromId(op.targets[0]);
    const cIdx = classicalBitIndexFromId(op.classicalTargets[0]);
    return `qc.measure(${qIdx}, ${cIdx})`;
  }

  if (gate === "reset") {
    const qIdx = qubitIndexFromId(op.targets[0]);
    return `qc.reset(${qIdx})`;
  }

  if (["h", "x", "y", "z", "s", "t", "sdg", "tdg", "id", "sx", "sxdg"].includes(gate)) {
    const qIdx = qubitIndexFromId(op.targets[0]);
    return `qc.${gate}(${qIdx})`;
  }

  if (["rx", "ry", "rz", "p"].includes(gate)) {
    const qIdx = qubitIndexFromId(op.targets[0]);
    const param = formatParameter(op) || "0";
    return `qc.${gate}(${param}, ${qIdx})`;
  }

  if (gate === "u") {
    const qIdx = qubitIndexFromId(op.targets[0]);
    const params = op.parameters ?? [];
    const theta = params[0]?.display ?? "pi/2";
    const phi = params[1]?.display ?? "0";
    const lam = params[2]?.display ?? "pi";
    return `qc.u(${theta}, ${phi}, ${lam}, ${qIdx})`;
  }

  if (["cx", "cz", "swap"].includes(gate)) {
    const cIdx = qubitIndexFromId(op.controls[0]);
    const tIdx = qubitIndexFromId(op.targets[0]);
    return `qc.${gate}(${cIdx}, ${tIdx})`;
  }

  if (["rxx", "rzz"].includes(gate)) {
    const q1 = qubitIndexFromId(op.controls[0] || op.targets[0]);
    const q2 = qubitIndexFromId(op.targets[0]);
    const param = formatParameter(op) || "pi/2";
    return `qc.${gate}(${param}, ${q1}, ${q2})`;
  }

  if (gate === "ccx") {
    const c1 = qubitIndexFromId(op.controls[0]);
    const c2 = qubitIndexFromId(op.controls[1]);
    const t = qubitIndexFromId(op.targets[0]);
    return `qc.ccx(${c1}, ${c2}, ${t})`;
  }

  if (gate === "rccx") {
    const c1 = qubitIndexFromId(op.controls[0]);
    const c2 = qubitIndexFromId(op.controls[1]);
    const t = qubitIndexFromId(op.targets[0]);
    return `qc.rccx(${c1}, ${c2}, ${t})`;
  }

  if (gate === "rc3x") {
    const [c1, c2, c3] = op.controls.map(qubitIndexFromId);
    const t = qubitIndexFromId(op.targets[0]);
    return `qc.rc3x(${c1}, ${c2}, ${c3}, ${t})`;
  }

  throw new Error(`Unsupported gate type: ${gate}`);
}

export function generateQiskitCode(circuit: Circuit): QiskitGenerateResult {
  try {
    const numQubits = circuit.qubits.length;
    const numClassical = circuit.classicalBits.length;

    const lines: string[] = [
      "from qiskit import QuantumCircuit",
      "",
      `qc = QuantumCircuit(${numQubits}${numClassical > 0 ? `, ${numClassical}` : ""})`,
    ];

    const sortedOps = [...circuit.operations].sort((a, b) => a.column - b.column);

    for (const op of sortedOps) {
      lines.push(emitGateLine(op));
    }

    return { success: true, code: lines.join("\n") + "\n" };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown generation error occurred";
    return { success: false, error: message };
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
