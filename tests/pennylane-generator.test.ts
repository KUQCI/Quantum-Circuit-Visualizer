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
Symbols named x0, x1, … read the input features (features[i]); other symbols are trainable params.
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
    expect(result.warnings).toEqual([
      "reset is not representable in a PennyLane ansatz — remove it or use qml.measure(reset=True) manually",
    ]);
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

  it("decomposes controlled U gates", () => {
    const circuit = createEmptyCircuit("Controlled U", 2);
    circuit.operations = [
      operation("cu3", 0, ["q1"], {
        controls: ["q0"],
        parameters: [
          { value: 0, display: "theta", symbol: "theta" },
          { value: 0, display: "phi", symbol: "phi" },
          { value: 0, display: "lam", symbol: "lam" },
        ],
      }),
      operation("cu", 1, ["q1"], {
        controls: ["q0"],
        parameters: [
          { value: 0, display: "a", symbol: "a" },
          { value: 0, display: "b", symbol: "b" },
          { value: 0, display: "c", symbol: "c" },
          { value: 0, display: "gamma", symbol: "gamma" },
        ],
      }),
    ];

    const result = generatePennylaneAnsatz(circuit);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain(
      "qml.ctrl(qml.U3(theta, phi, lam, wires=1), control=0)"
    );
    expect(result.code).toContain("qml.PhaseShift(gamma, wires=0)");
    expect(result.code).toContain(
      "qml.ctrl(qml.U3(a, b, c, wires=1), control=0)"
    );
  });

  it("decomposes relative-phase Toffoli gates", () => {
    const rccxCircuit = createEmptyCircuit("RCCX", 3);
    rccxCircuit.operations = [
      operation("rccx", 0, ["q2"], {
        controls: ["q0", "q1"],
      }),
    ];
    const rccx = generatePennylaneAnsatz(rccxCircuit);

    expect(rccx.success).toBe(true);
    if (!rccx.success) return;
    expect(rccx.warnings).toEqual([]);
    expect(
      rccx.code
        .split("# rccx (relative-phase Toffoli)\n")[1]
        .split("\n")
        .filter((line) => line.trim().startsWith("qml."))
    ).toHaveLength(9);
    expect(rccx.code).toContain(`# rccx (relative-phase Toffoli)
    qml.U2(0, pi, wires=2)
    qml.PhaseShift(pi/4, wires=2)
    qml.CNOT(wires=[1, 2])
    qml.PhaseShift(-pi/4, wires=2)
    qml.CNOT(wires=[0, 2])
    qml.PhaseShift(pi/4, wires=2)
    qml.CNOT(wires=[1, 2])
    qml.PhaseShift(-pi/4, wires=2)
    qml.U2(0, pi, wires=2)`);

    const rc3xCircuit = createEmptyCircuit("RC3X", 4);
    rc3xCircuit.operations = [
      operation("rc3x", 0, ["q3"], {
        controls: ["q0", "q1", "q2"],
      }),
    ];
    const rc3x = generatePennylaneAnsatz(rc3xCircuit);

    expect(rc3x.success).toBe(true);
    if (!rc3x.success) return;
    expect(rc3x.warnings).toEqual([]);
    expect(rc3x.code).toContain("# rc3x");
    expect(rc3x.code).toContain("qml.CNOT(wires=[2, 3])");
    expect(rc3x.code).toContain("qml.CNOT(wires=[0, 3])");
    expect(rc3x.code).toContain("qml.CNOT(wires=[1, 3])");
  });

  it("maps x-indexed symbols to feature inputs", () => {
    const circuit = createEmptyCircuit("Features", 2);
    circuit.operations = [
      operation("rx", 0, ["q0"], {
        parameters: [{ value: 0, display: "x0", symbol: "x0" }],
      }),
      operation("ry", 1, ["q1"], {
        parameters: [{ value: 0, display: "x_1", symbol: "x_1" }],
      }),
      operation("cx", 2, ["q1"], { controls: ["q0"] }),
    ];

    const result = generatePennylaneAnsatz(circuit);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain("PARAM_NAMES = []");
    expect(result.code).toContain("qml.RX(features[0], wires=0)");
    expect(result.code).toContain("qml.RY(features[1], wires=1)");
    expect(result.code).not.toContain("AngleEmbedding");
    expect(result.code).toContain("def feature_map(features, n_qubits=N_QUBITS):");
    expect(result.code).toContain("from qlearn import QuantumFeatureMap");
    expect(result.code).not.toContain("VariationalQuantumClassifier");
  });

  it("keeps trainable params and feature inputs distinct", () => {
    const circuit = createEmptyCircuit("Mixed", 2);
    circuit.operations = [
      operation("rx", 0, ["q0"], {
        parameters: [{ value: 0, display: "x0", symbol: "x0" }],
      }),
      operation("ry", 1, ["q1"], {
        parameters: [{ value: 0, display: "theta", symbol: "theta" }],
      }),
    ];

    const result = generatePennylaneAnsatz(circuit);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.code).toContain('PARAM_NAMES = ["theta"]');
    expect(result.code).toContain("qml.RX(features[0], wires=0)");
    expect(result.code).toContain("qml.RY(theta, wires=1)");
    expect(result.code).toContain("VariationalQuantumClassifier");
    expect(result.code).not.toContain("AngleEmbedding");
  });

  it("warns when a feature index exceeds the circuit qubits", () => {
    const circuit = createEmptyCircuit("Feature warning", 2);
    circuit.operations = [
      operation("rx", 0, ["q0"], {
        parameters: [{ value: 0, display: "x3", symbol: "x3" }],
      }),
    ];

    const result = generatePennylaneAnsatz(circuit);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.warnings).toContain(
      "Feature index x3 exceeds N_QUBITS (2) — make sure your data has at least 4 columns"
    );
  });
});
