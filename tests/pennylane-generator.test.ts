import { describe, expect, it } from "vitest";
import { createEmptyCircuit, type Operation } from "@/lib/circuit-schema";
import { generatePennylaneAnsatz } from "@/lib/pennylane-generator";

function operation(
  type: string,
  column: number,
  targets: string[],
  options: Partial<Operation> = {}
): Operation {
  return {
    id: `${type}-${column}`,
    type,
    label: type.toUpperCase(),
    targets,
    controls: [],
    classicalTargets: [],
    column,
    ...options,
  };
}

describe("generatePennylaneAnsatz", () => {
  it("generates the expected Bell ansatz", () => {
    const circuit = createEmptyCircuit("Bell", 2);
    circuit.operations = [
      operation("h", 0, ["q0"]),
      operation("cx", 1, ["q1"], { controls: ["q0"] }),
    ];

    const result = generatePennylaneAnsatz(circuit);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toBe(`"""Ansatz exported from QCI Quantum Circuit Visualizer for quantum-learn.

Symbolic circuit parameters become trainable entries of \`params\`
(order: PARAM_NAMES). Numeric parameters are kept as constants.
"""
import pennylane as qml
from numpy import pi

N_QUBITS = 2
PARAM_NAMES = []
N_PARAMS = len(PARAM_NAMES)


def ansatz(features, params, n_qubits=N_QUBITS):
    # Data encoding — remove if your circuit already encodes features
    qml.AngleEmbedding(features, wires=range(n_qubits))
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])


# --- Train it with quantum-learn ---
# pip install "quantum-learn[pennylane]"
import numpy as np
import pandas as pd
from qlearn import VariationalQuantumClassifier

clf = VariationalQuantumClassifier(
    fit_kwargs={"n_qubits": N_QUBITS, "ansatz": ansatz},
)
# X_train: pandas DataFrame with N_QUBITS feature columns, y_train: pandas Series
# params = np.random.uniform(0, 2 * pi, N_PARAMS)
# clf.fit(X_train, y_train, params=params)
# print(clf.predict(X_test))
`);
  });

  it("collects symbolic parameters in column order and unpacks them", () => {
    const circuit = createEmptyCircuit("Symbolic", 2);
    circuit.operations = [
      operation("ry", 2, ["q1"], {
        parameters: [{ value: 0, display: "theta", symbol: "theta" }],
      }),
      operation("rz", 1, ["q0"], {
        parameters: [{ value: 0, display: "phi", symbol: "phi" }],
      }),
    ];

    const result = generatePennylaneAnsatz(circuit);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain('PARAM_NAMES = ["phi", "theta"]');
    expect(result.code).toContain("phi, theta = params[0], params[1]");
    expect(result.code).toContain("qml.RZ(phi, wires=0)");
    expect(result.code).toContain("qml.RY(theta, wires=1)");
  });

  it("preserves symbolic expressions while sanitizing identifiers", () => {
    const circuit = createEmptyCircuit("Expression", 1);
    circuit.operations = [
      operation("ry", 0, ["q0"], {
        parameters: [{ value: 0, display: "2*theta", symbol: "2*theta" }],
      }),
      operation("rz", 1, ["q0"], {
        parameters: [{ value: 0, display: "-theta", symbol: "-theta" }],
      }),
    ];

    const result = generatePennylaneAnsatz(circuit);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain('PARAM_NAMES = ["theta"]');
    expect(result.code).toContain("qml.RY(2*theta, wires=0)");
    expect(result.code).toContain("qml.RZ(-theta, wires=0)");
  });

  it("warns once for measurements", () => {
    const circuit = createEmptyCircuit("Measured", 1, 1);
    circuit.operations = [
      operation("measure", 0, ["q0"], { classicalTargets: ["c0"] }),
      operation("measure", 1, ["q0"], { classicalTargets: ["c0"] }),
    ];

    const result = generatePennylaneAnsatz(circuit);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.warnings).toEqual([
      "measurements are handled by quantum-learn's measurement= setting",
    ]);
    expect(result.code).not.toContain("qml.measure");
  });

  it("warns for unsupported gates", () => {
    const circuit = createEmptyCircuit("Unsupported", 1);
    circuit.operations = [operation("reset", 0, ["q0"])];

    const result = generatePennylaneAnsatz(circuit);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.warnings[0]).toContain("reset");
    expect(result.warnings[0]).toContain("not supported");
  });

  it("does not emit an unpack line when there are no symbols", () => {
    const circuit = createEmptyCircuit("Numeric", 1);
    circuit.operations = [
      operation("ry", 0, ["q0"], {
        parameters: [{ value: Math.PI / 2, display: "pi/2" }],
      }),
    ];

    const result = generatePennylaneAnsatz(circuit);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain("PARAM_NAMES = []");
    expect(result.code).not.toContain("params[0]");
    expect(result.code).toContain("qml.RY(pi/2, wires=0)");
  });
});
