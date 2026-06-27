import type { Circuit, Operation } from "@/lib/circuit-schema";
import type {
  CheckCondition,
  CheckResult,
  CheckerContext,
} from "./types";

function sortedOps(ops: Operation[]): Operation[] {
  return [...ops].sort((a, b) => a.column - b.column || a.id.localeCompare(b.id));
}

function opSignature(op: Operation): string {
  const params = op.parameters?.[0]?.display ?? "";
  return [
    op.type,
    op.targets.join(","),
    op.controls.join(","),
    op.classicalTargets.join(","),
    params,
  ].join("|");
}

function normalizeCircuit(circuit: Circuit): string[] {
  return sortedOps(circuit.operations).map(opSignature);
}

function checkSingle(
  circuit: Circuit,
  condition: CheckCondition,
  ctx: CheckerContext
): CheckResult {
  switch (condition.type) {
    case "manual":
      return {
        success: true,
        message: "Great — you're ready for the next step!",
      };

    case "actionExport":
      return ctx.actionExportDone
        ? { success: true, message: "Code exported successfully!" }
        : {
            success: false,
            message: "Copy or download the Qiskit code to complete this step.",
            hint: "Use the Copy button in the code panel on the right.",
          };

    case "actionImport":
      return ctx.actionImportDone
        ? { success: true, message: "Import successful!" }
        : {
            success: false,
            message: "Paste the Qiskit code and sync it to the canvas.",
            hint: "Paste code in the editor and click Sync, or use Import from the nav.",
          };

    case "hasGate": {
      const found = circuit.operations.some((op) => op.type === condition.gate);
      return found
        ? { success: true, message: `Found ${condition.gate.toUpperCase()} gate.` }
        : {
            success: false,
            message: `Add a ${condition.gate.toUpperCase()} gate to your circuit.`,
          };
    }

    case "hasGateOnQubit": {
      const found = circuit.operations.some(
        (op) =>
          op.type === condition.gate &&
          op.targets.includes(condition.target)
      );
      return found
        ? {
            success: true,
            message: `${condition.gate.toUpperCase()} is on ${condition.target}.`,
          }
        : {
            success: false,
            message: `Place ${condition.gate.toUpperCase()} on ${condition.target}.`,
            hint: `Drag ${condition.gate.toUpperCase()} onto the ${condition.target} wire.`,
          };
    }

    case "hasControlledGate": {
      const found = circuit.operations.some(
        (op) =>
          op.controls.length > 0 &&
          (!condition.gate || op.type === condition.gate)
      );
      return found
        ? { success: true, message: "Controlled gate detected!" }
        : {
            success: false,
            message: "Add a controlled gate (like CX) to entangle qubits.",
            hint: "Try CNOT: control on q0, target on q1.",
          };
    }

    case "hasMeasurement": {
      const found = circuit.operations.some((op) => {
        if (op.type !== "measure") return false;
        if (condition.qubit && !op.targets.includes(condition.qubit)) return false;
        if (
          condition.classical &&
          !op.classicalTargets.includes(condition.classical)
        )
          return false;
        return true;
      });
      return found
        ? { success: true, message: "Measurement in place!" }
        : {
            success: false,
            message: condition.qubit
              ? `Measure ${condition.qubit} into ${condition.classical ?? "a classical bit"}.`
              : "Add a measurement operation.",
            hint: "Drag the Measure gate onto a qubit wire.",
          };
    }

    case "operationOrder": {
      const ops = sortedOps(circuit.operations);
      if (ops.length < condition.operations.length) {
        return {
          success: false,
          message: "Add the gates in the correct order.",
          hint: "Follow the sequence described in the instructions.",
        };
      }
      for (let i = 0; i < condition.operations.length; i++) {
        const expected = condition.operations[i];
        const actual = ops[i];
        if (actual.type !== expected.gate) {
          return {
            success: false,
            message: `Gate ${i + 1} should be ${expected.gate.toUpperCase()}, not ${actual.type.toUpperCase()}.`,
          };
        }
        if (expected.target && !actual.targets.includes(expected.target)) {
          return {
            success: false,
            message: `${expected.gate.toUpperCase()} should target ${expected.target}.`,
          };
        }
        if (expected.control && !actual.controls.includes(expected.control)) {
          return {
            success: false,
            message: `${expected.gate.toUpperCase()} needs control ${expected.control}.`,
          };
        }
      }
      return { success: true, message: "Gate order looks perfect!" };
    }

    case "exactCircuitMatch": {
      const a = normalizeCircuit(circuit);
      const b = normalizeCircuit(condition.circuit);
      if (a.length !== b.length) {
        return {
          success: false,
          message: "Circuit doesn't match the target yet.",
          hint: "Compare your gates with the target circuit.",
        };
      }
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return {
            success: false,
            message: "Gate pattern doesn't match the target.",
            hint: "Check gate types, targets, and order.",
          };
        }
      }
      return { success: true, message: "Exact match!" };
    }

    case "maxOperations":
      return circuit.operations.length <= condition.count
        ? { success: true, message: "Operation count OK." }
        : {
            success: false,
            message: `Use at most ${condition.count} operation(s).`,
            hint: "Remove extra gates from the canvas.",
          };

    case "minQubits":
      return circuit.qubits.length >= condition.count
        ? { success: true, message: "Enough qubits." }
        : {
            success: false,
            message: `This circuit needs at least ${condition.count} qubits.`,
          };

    case "noExtraGates": {
      const extra = circuit.operations.filter(
        (op) => !condition.allowed.includes(op.type)
      );
      return extra.length === 0
        ? { success: true, message: "No extra gates." }
        : {
            success: false,
            message: `Remove unexpected gate: ${extra[0].type.toUpperCase()}.`,
          };
    }

    case "hasParameterGate": {
      const found = circuit.operations.some(
        (op) =>
          op.type === condition.gate &&
          op.parameters &&
          op.parameters.length > 0 &&
          (!condition.target || op.targets.includes(condition.target))
      );
      return found
        ? { success: true, message: `${condition.gate.toUpperCase()} with parameter found.` }
        : {
            success: false,
            message: `Add ${condition.gate.toUpperCase()} with a rotation parameter.`,
            hint: "Parameterized gates accept values like pi/2.",
          };
    }

    case "all": {
      for (const sub of condition.conditions) {
        const result = checkSingle(circuit, sub, ctx);
        if (!result.success) return result;
      }
      return { success: true, message: "All conditions met!" };
    }

    case "any": {
      for (const sub of condition.conditions) {
        const result = checkSingle(circuit, sub, ctx);
        if (result.success) return result;
      }
      return {
        success: false,
        message: "None of the required conditions are met yet.",
      };
    }

    default:
      return { success: false, message: "Unknown check type." };
  }
}

export function checkCircuit(
  circuit: Circuit,
  condition: CheckCondition,
  ctx: CheckerContext = {}
): CheckResult {
  return checkSingle(circuit, condition, ctx);
}

export function circuitHasControlledGate(circuit: Circuit): boolean {
  return circuit.operations.some((op) => op.controls.length > 0);
}

export function circuitHasAnyGate(circuit: Circuit): boolean {
  return circuit.operations.length > 0;
}
