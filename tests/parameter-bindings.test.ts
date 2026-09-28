import { describe, expect, it } from "vitest";
import { createEmptyCircuit, type Circuit } from "@/lib/circuit-schema";
import {
  evaluateSymbolicExpression,
  symbolNamesInExpression,
} from "@/lib/translator-core";
import {
  bindCircuitParameters,
  circuitSymbols,
  unboundSymbols,
} from "@/lib/parameter-bindings";
import { simulateCircuit } from "@/lib/quantum-state";
import { runCircuitShots } from "@/lib/shot-simulator";

function parameterCircuit(): Circuit {
  const circuit = createEmptyCircuit("Parameters", 2);
  circuit.operations = [
    {
      id: "z",
      type: "rz",
      label: "RZ",
      targets: ["q1"],
      controls: [],
      classicalTargets: [],
      column: 2,
      parameters: [{ value: 0, display: "2*theta", symbol: "2*theta" }],
    },
    {
      id: "y",
      type: "ry",
      label: "RY",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 1,
      parameters: [{ value: 0, display: "phi", symbol: "phi" }],
    },
    {
      id: "x",
      type: "rx",
      label: "RX",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 0,
      parameters: [{ value: 0, display: "theta", symbol: "theta" }],
    },
  ];
  return circuit;
}

describe("symbolic parameter expressions", () => {
  it("evaluates a single symbol and arithmetic expressions", () => {
    expect(evaluateSymbolicExpression("theta", { theta: 1.25 })).toBeCloseTo(1.25);
    expect(evaluateSymbolicExpression("2*theta", { theta: 0.75 })).toBeCloseTo(1.5);
    expect(evaluateSymbolicExpression("-theta", { theta: -0.5 })).toBeCloseTo(0.5);
    expect(
      evaluateSymbolicExpression("pi/2 + phi", { phi: Math.PI / 4 })
    ).toBeCloseTo((3 * Math.PI) / 4);
  });

  it("reports the missing symbol name", () => {
    expect(() => evaluateSymbolicExpression("theta + phi", { theta: 1 })).toThrow(
      "Unbound parameter phi"
    );
  });

  it("extracts unique names in first-appearance order", () => {
    expect(symbolNamesInExpression("2*theta + phi - theta")).toEqual([
      "theta",
      "phi",
    ]);
  });
});

describe("circuit parameter bindings", () => {
  it("orders symbols by operation column, id, and parameter appearance", () => {
    expect(circuitSymbols(parameterCircuit())).toEqual(["theta", "phi"]);
  });

  it("keeps partially bound parameters symbolic", () => {
    const circuit = parameterCircuit();
    circuit.parameterBindings = { theta: Math.PI / 2 };
    const bound = bindCircuitParameters(circuit);
    expect(bound.operations[0].parameters?.[0]).toEqual({
      value: Math.PI,
      display: "2*theta",
    });
    expect(bound.operations[1].parameters?.[0]).toEqual(
      circuit.operations[1].parameters?.[0]
    );
    expect(unboundSymbols(bound)).toEqual(["phi"]);
  });

  it("binds complete expressions and removes the symbol key", () => {
    const circuit = parameterCircuit();
    circuit.parameterBindings = { theta: 0.5, phi: 1 };
    const bound = bindCircuitParameters(circuit);
    expect(bound.operations[0].parameters?.[0]).toEqual({
      value: 1,
      display: "2*theta",
    });
    expect(bound.operations[1].parameters?.[0]).toEqual({
      value: 1,
      display: "phi",
    });
    expect(unboundSymbols(bound)).toEqual([]);
  });
});

describe("simulator parameter bindings", () => {
  it("simulates RX(theta) at pi as |1⟩", () => {
    const circuit = createEmptyCircuit("RX theta", 1);
    circuit.parameterBindings = { theta: Math.PI };
    circuit.operations = [
      {
        id: "rx",
        type: "rx",
        label: "RX",
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: 0,
        parameters: [{ value: 0, display: "theta", symbol: "theta" }],
      },
    ];
    const result = simulateCircuit(circuit);
    expect(result.error).toBeNull();
    expect(result.probabilities.find((entry) => entry.label === "|1⟩")?.probability).toBeCloseTo(1);
  });

  it("keeps the existing unbound error for missing bindings", () => {
    const circuit = createEmptyCircuit("RX theta", 1);
    circuit.operations = [
      {
        id: "rx",
        type: "rx",
        label: "RX",
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: 0,
        parameters: [{ value: 0, display: "theta", symbol: "theta" }],
      },
    ];
    expect(simulateCircuit(circuit).error).toContain("Unbound parameter theta");
  });

  it("lists only symbols that remain unbound", () => {
    const circuit = parameterCircuit();
    circuit.parameterBindings = { theta: 0.5 };
    expect(simulateCircuit(circuit).error).toBe(
      "Unbound parameter phi — bind a value before simulating"
    );
  });

  it("runs shots for a bound symbolic circuit", () => {
    const circuit = createEmptyCircuit("RX theta", 1);
    circuit.parameterBindings = { theta: Math.PI };
    circuit.operations = [
      {
        id: "rx",
        type: "rx",
        label: "RX",
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: 0,
        parameters: [{ value: 0, display: "theta", symbol: "theta" }],
      },
    ];
    const result = runCircuitShots(circuit, 8);
    expect(result.error).toBeNull();
    expect(Object.values(result.counts).reduce((sum, count) => sum + count, 0)).toBe(8);
  });
});
