import type { Circuit, Operation, Parameter } from "./circuit-schema";
import {
  evaluateSymbolicExpression,
  symbolNamesInExpression,
} from "./translator-core";

function parameterNames(parameter: Parameter): string[] {
  return parameter.symbol ? symbolNamesInExpression(parameter.symbol) : [];
}

function orderedOperations(circuit: Circuit): Operation[] {
  return [...circuit.operations].sort(
    (a, b) => a.column - b.column || a.id.localeCompare(b.id)
  );
}

export function circuitSymbols(circuit: Circuit): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const operation of orderedOperations(circuit)) {
    for (const parameter of operation.parameters ?? []) {
      for (const name of parameterNames(parameter)) {
        if (!seen.has(name)) {
          seen.add(name);
          names.push(name);
        }
      }
    }
  }

  return names;
}

function hasFiniteBinding(
  bindings: Record<string, number> | undefined,
  name: string
): boolean {
  return (
    bindings !== undefined &&
    Object.prototype.hasOwnProperty.call(bindings, name) &&
    Number.isFinite(bindings[name])
  );
}

export function bindCircuitParameters(circuit: Circuit): Circuit {
  const symbols = circuitSymbols(circuit);
  if (symbols.length === 0) return circuit;

  const bindings = circuit.parameterBindings;
  const operations = circuit.operations.map((operation) => {
    let changed = false;
    const parameters = operation.parameters?.map((parameter) => {
      const names = parameterNames(parameter);
      if (
        names.length === 0 ||
        names.some((name) => !hasFiniteBinding(bindings, name))
      ) {
        return parameter;
      }

      changed = true;
      return {
        value: evaluateSymbolicExpression(parameter.symbol!, bindings!),
        ...(parameter.display !== undefined
          ? { display: parameter.display }
          : {}),
      };
    });

    return changed ? { ...operation, parameters } : operation;
  });

  return { ...circuit, operations };
}

export function unboundSymbols(circuit: Circuit): string[] {
  const bindings = circuit.parameterBindings;
  return circuitSymbols(circuit).filter(
    (name) => !hasFiniteBinding(bindings, name)
  );
}
