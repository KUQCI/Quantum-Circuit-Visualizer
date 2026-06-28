import { CircuitSchema, Circuit, Operation, qubitIndexFromId, classicalBitIndexFromId } from "./circuit-schema";
import { ZodError } from "zod";

export interface ValidationResult {
  valid: true;
  circuit: Circuit;
}

export interface ValidationError {
  valid: false;
  errors: string[];
}

export function validateCircuit(data: unknown): ValidationResult | ValidationError {
  try {
    const circuit = CircuitSchema.parse(data);
    return { valid: true, circuit };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        valid: false,
        errors: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      };
    }
    return { valid: false, errors: ["Unknown validation error"] };
  }
}

export function isOperationValidForCircuit(op: Operation, circuit: Circuit): boolean {
  const maxQ = circuit.qubits.length;
  const maxC = circuit.classicalBits.length;
  const qubitIds = new Set(circuit.qubits.map((q) => q.id));
  const classicalIds = new Set(circuit.classicalBits.map((c) => c.id));

  for (const id of [...op.targets, ...op.controls]) {
    if (!qubitIds.has(id)) return false;
    const idx = qubitIndexFromId(id);
    if (!Number.isInteger(idx) || idx < 0 || idx >= maxQ) return false;
  }

  for (const id of op.classicalTargets) {
    if (!classicalIds.has(id)) return false;
    const idx = classicalBitIndexFromId(id);
    if (!Number.isInteger(idx) || idx < 0 || idx >= maxC) return false;
  }

  return true;
}

export function repairCircuit(circuit: Circuit): Circuit {
  return {
    ...circuit,
    operations: circuit.operations.filter((op) =>
      isOperationValidForCircuit(op, circuit)
    ),
  };
}

export function validateCircuitPlacement(circuit: Circuit): string[] {
  const warnings: string[] = [];
  const columnMap = new Map<number, Set<string>>();

  for (const op of circuit.operations) {
    const affectedQubits = [...op.targets, ...op.controls];
    if (!columnMap.has(op.column)) {
      columnMap.set(op.column, new Set());
    }
    const qubitsAtColumn = columnMap.get(op.column)!;

    for (const qId of affectedQubits) {
      if (qubitsAtColumn.has(qId)) {
        warnings.push(
          `Qubit ${qId} has overlapping gates at column ${op.column + 1}`
        );
      }
      qubitsAtColumn.add(qId);
    }
  }

  for (const op of circuit.operations) {
    if (op.type === "measure" && op.classicalTargets.length === 0) {
      warnings.push(`Measure gate ${op.id} is missing a classical target`);
    }
    if (["cx", "cz", "swap"].includes(op.type) && op.controls.length === 0) {
      warnings.push(`${op.type.toUpperCase()} gate ${op.id} is missing a control qubit`);
    }
    if (["rx", "ry", "rz"].includes(op.type) && !op.parameters?.length) {
      warnings.push(`${op.type.toUpperCase()} gate ${op.id} is missing rotation parameter`);
    }
  }

  return warnings;
}
