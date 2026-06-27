import type { Circuit } from "./circuit-schema";
import { GATE_LIBRARY, formatParam } from "./translator-core";

export interface GenerateResult {
  success: true;
  code: string;
}

export interface GenerateError {
  success: false;
  error: string;
}

export type OpenQasmGenerateResult = GenerateResult | GenerateError;

export function generateOpenQasm(circuit: Circuit): OpenQasmGenerateResult {
  try {
    const lines = ['OPENQASM 2.0;', 'include "qelib1.inc";', ""];

    lines.push(`qreg q[${circuit.qubits.length}];`);
    if (circuit.classicalBits.length > 0) {
      lines.push(`creg c[${circuit.classicalBits.length}];`);
    }
    lines.push("");

    const sortedOps = [...circuit.operations].sort((a, b) => a.column - b.column);

    for (const op of sortedOps) {
      if (op.type === "barrier") {
        const qubitStr = circuit.qubits.map((q) => q.label).join(",");
        lines.push(`barrier ${qubitStr};`);
        continue;
      }

      if (op.type === "reset") {
        const qIdx = parseInt(op.targets[0].replace("q", ""), 10);
        lines.push(`reset q[${qIdx}];`);
        continue;
      }

      if (op.type === "measure") {
        const qIdx = parseInt(op.targets[0].replace("q", ""), 10);
        const cIdx = parseInt(op.classicalTargets[0].replace("c", ""), 10);
        lines.push(`measure q[${qIdx}] -> c[${cIdx}];`);
        continue;
      }

      const gateInfo = GATE_LIBRARY[op.type];
      if (!gateInfo) {
        throw new Error(`Gate ${op.type} not supported in OpenQASM export`);
      }

      const paramStr =
        op.parameters && op.parameters.length > 0
          ? `(${op.parameters.map((p) => p.display ?? formatParam(p.value)).join(",")})`
          : "";

      if (gateInfo.nQubits === 1) {
        const qIdx = parseInt(op.targets[0].replace("q", ""), 10);
        lines.push(`${op.type}${paramStr} q[${qIdx}];`);
      } else if (gateInfo.nQubits === 2) {
        if (op.type === "swap" && op.targets.length === 2) {
          const q1 = parseInt(op.targets[0].replace("q", ""), 10);
          const q2 = parseInt(op.targets[1].replace("q", ""), 10);
          lines.push(`swap q[${q1}],q[${q2}];`);
        } else {
          const cIdx = parseInt(op.controls[0].replace("q", ""), 10);
          const tIdx = parseInt(op.targets[0].replace("q", ""), 10);
          lines.push(`${op.type}${paramStr} q[${cIdx}],q[${tIdx}];`);
        }
      } else if (gateInfo.nQubits === 3) {
        const c1 = parseInt(op.controls[0].replace("q", ""), 10);
        const c2 = parseInt(op.controls[1].replace("q", ""), 10);
        const t = parseInt(op.targets[0].replace("q", ""), 10);
        lines.push(`${op.type}${paramStr} q[${c1}],q[${c2}],q[${t}];`);
      } else if (gateInfo.nQubits === 4) {
        const c1 = parseInt(op.controls[0].replace("q", ""), 10);
        const c2 = parseInt(op.controls[1].replace("q", ""), 10);
        const c3 = parseInt(op.controls[2].replace("q", ""), 10);
        const t = parseInt(op.targets[0].replace("q", ""), 10);
        lines.push(`${op.type}${paramStr} q[${c1}],q[${c2}],q[${c3}],q[${t}];`);
      }
    }

    return { success: true, code: lines.join("\n") + "\n" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenQASM generation failed";
    return { success: false, error: message };
  }
}

/** @deprecated Use generateOpenQasm */
export function circuitToQasm(circuit: Circuit): string {
  const result = generateOpenQasm(circuit);
  if (!result.success) throw new Error(result.error);
  return result.code;
}
