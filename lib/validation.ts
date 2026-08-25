import {
  CircuitSchema,
  Circuit,
  Operation,
  SUPPORTED_GATES,
  qubitIndexFromId,
  classicalBitIndexFromId,
} from "./circuit-schema";
import { ZodError } from "zod";

export interface ValidationResult {
  valid: true;
  circuit: Circuit;
}

export interface ValidationError {
  valid: false;
  errors: string[];
}

export interface SemanticCheckResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
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

/** Semantic checks for translator IR (errors = hard; warnings = soft). */
export function validateCircuitSemantics(circuit: Circuit): SemanticCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const v1 = new Set<string>(SUPPORTED_GATES);

  for (const op of circuit.operations) {
    if (!Number.isInteger(op.column) || op.column < 0) {
      errors.push(`Operation ${op.id}: column must be a non-negative integer`);
    }

    if (!isOperationValidForCircuit(op, circuit)) {
      errors.push(`Operation ${op.id} (${op.type}): target/control/classical id out of range`);
      continue;
    }

    if (!v1.has(op.type) && !["id", "sx", "sxdg", "p", "u", "rxx", "rzz", "ccx", "rccx", "rc3x", "reset"].includes(op.type)) {
      warnings.push(`Operation ${op.id}: gate type '${op.type}' is outside the v1 supported set`);
    }

    if (op.type === "measure") {
      if (op.targets.length !== 1) {
        errors.push(`measure ${op.id}: needs exactly one qubit target`);
      }
      if (op.classicalTargets.length !== 1) {
        errors.push(`measure ${op.id}: needs exactly one classical target`);
      }
    }

    if (op.type === "cx" || op.type === "cz") {
      if (op.controls.length !== 1 || op.targets.length !== 1) {
        errors.push(`${op.type} ${op.id}: needs one control and one target`);
      }
    }

    if (op.type === "swap") {
      const n = op.targets.length + (op.controls.length > 0 ? 1 : 0);
      if (op.targets.length !== 2 && !(op.controls.length === 1 && op.targets.length === 1)) {
        errors.push(`swap ${op.id}: needs two qubit targets`);
      }
      void n;
    }

    if (["rx", "ry", "rz"].includes(op.type)) {
      if (!op.parameters?.length) {
        errors.push(`${op.type} ${op.id}: missing rotation parameter`);
      }
    }
  }

  const placement = validateCircuitPlacement(circuit);
  warnings.push(...placement);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
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
    if (["cx", "cz"].includes(op.type) && op.controls.length === 0) {
      warnings.push(`${op.type.toUpperCase()} gate ${op.id} is missing a control qubit`);
    }
    if (["cx", "cz"].includes(op.type) && op.controls.length > 0 && op.targets.length > 0) {
      if (op.controls[0] === op.targets[0]) {
        warnings.push(
          `${op.type.toUpperCase()} gate ${op.id}: control and target cannot be the same qubit`
        );
      }
    }
    if (op.type === "swap" && op.targets.length >= 2 && op.targets[0] === op.targets[1]) {
      warnings.push(`SWAP gate ${op.id}: both targets cannot be the same qubit`);
    }
    if (["rx", "ry", "rz"].includes(op.type) && !op.parameters?.length) {
      warnings.push(`${op.type.toUpperCase()} gate ${op.id} is missing rotation parameter`);
    }
    if (!isOperationValidForCircuit(op, circuit)) {
      warnings.push(
        `Operation ${op.id} (${op.type}) references a missing qubit or classical bit`
      );
    }
  }

  return warnings;
}
