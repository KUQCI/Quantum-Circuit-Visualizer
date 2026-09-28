import type { Circuit, Operation, Parameter } from "./circuit-schema";
import { qubitIndexFromId } from "./circuit-schema";
import { formatParam, symbolNamesInExpression } from "./translator-core";

export interface GenerateResult {
  success: true;
  code: string;
  warnings: string[];
}

export interface GenerateError {
  success: false;
  error: string;
}

export type PennylaneGenerateResult = GenerateResult | GenerateError;

const PYTHON_KEYWORDS = new Set([
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "case",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "false",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "match",
  "none",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "true",
  "try",
  "while",
  "with",
  "yield",
]);

function sanitizeIdentifier(value: string): string {
  const sanitized = value.replace(/[^A-Za-z0-9_]/g, "_");
  const prefixed =
    sanitized.length === 0 || /^\d/.test(sanitized)
      ? `p_${sanitized}`
      : sanitized;
  return PYTHON_KEYWORDS.has(prefixed) ? `p_${prefixed}` : prefixed;
}

function symbolicNames(parameter: Parameter): string[] {
  const expression = parameter.symbol ?? parameter.display;
  if (!expression) return [];

  return symbolNamesInExpression(expression);
}

function buildSymbolMap(circuit: Circuit): {
  names: string[];
  symbols: Map<string, string>;
  features: Map<string, number>;
  maxFeatureIndex: number;
} {
  const names: string[] = [];
  const symbols = new Map<string, string>();
  const features = new Map<string, number>();
  const used = new Set<string>();
  let maxFeatureIndex = -1;

  const sorted = [...circuit.operations].sort(
    (a, b) => a.column - b.column || a.id.localeCompare(b.id)
  );
  for (const op of sorted) {
    for (const parameter of op.parameters ?? []) {
      for (const raw of symbolicNames(parameter)) {
        const featureMatch = raw.match(/^x_?(\d+)$/);
        if (featureMatch) {
          const index = Number(featureMatch[1]);
          features.set(raw, index);
          maxFeatureIndex = Math.max(maxFeatureIndex, index);
          continue;
        }
        if (symbols.has(raw)) continue;
        let identifier = sanitizeIdentifier(raw);
        let suffix = 2;
        while (used.has(identifier)) {
          identifier = `${sanitizeIdentifier(raw)}_${suffix}`;
          suffix += 1;
        }
        symbols.set(raw, identifier);
        used.add(identifier);
        names.push(identifier);
      }
    }
  }

  return { names, symbols, features, maxFeatureIndex };
}

function formatParameter(
  parameter: Parameter | undefined,
  symbols: Map<string, string>,
  features: Map<string, number>
): string {
  if (!parameter) return "";
  const expression = parameter.display ?? parameter.symbol ?? formatParam(parameter.value);
  return expression.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (name) => {
    const featureIndex = features.get(name);
    return featureIndex === undefined
      ? symbols.get(name) ?? name
      : `features[${featureIndex}]`;
  });
}

function qmlWire(index: number): string {
  return `wires=${index}`;
}

function pairWires(op: Operation): [number, number] | null {
  const first = op.controls[0] ?? op.targets[0];
  const second = op.controls.length > 0 ? op.targets[0] : op.targets[1];
  if (!first || !second) return null;
  return [qubitIndexFromId(first), qubitIndexFromId(second)];
}

function emitGate(
  op: Operation,
  symbols: Map<string, string>,
  features: Map<string, number>
): { line: string } | { lines: string[] } | { warning: string } {
  const gate = op.type;
  const target = op.targets[0];
  const targetIndex = target ? qubitIndexFromId(target) : null;
  const parameter = (index = 0) =>
    formatParameter(op.parameters?.[index], symbols, features) || "0";

  if (gate === "barrier") {
    return { line: `qml.Barrier(wires=range(n_qubits))` };
  }

  if (gate === "measure") {
    return {
      warning:
        "measurements are handled by quantum-learn's measurement= setting",
    };
  }

  if (gate === "reset") {
    return {
      warning:
        "reset is not representable in a PennyLane ansatz — remove it or use qml.measure(reset=True) manually",
    };
  }

  if (targetIndex === null) {
    return { warning: `${gate} ${op.id}: missing target` };
  }

  const simpleGates: Record<string, string> = {
    h: "Hadamard",
    x: "PauliX",
    y: "PauliY",
    z: "PauliZ",
    id: "Identity",
    s: "S",
    t: "T",
    sx: "SX",
  };
  if (simpleGates[gate]) {
    return { line: `qml.${simpleGates[gate]}(${qmlWire(targetIndex)})` };
  }

  if (gate === "sdg" || gate === "tdg" || gate === "sxdg") {
    const base = gate === "sdg" ? "S" : gate === "tdg" ? "T" : "SX";
    return {
      line: `qml.adjoint(qml.${base})(${qmlWire(targetIndex)})`,
    };
  }

  if (["rx", "ry", "rz"].includes(gate)) {
    return {
      line: `qml.${gate.toUpperCase()}(${parameter()}, ${qmlWire(targetIndex)})`,
    };
  }

  if (gate === "p" || gate === "u1") {
    return {
      line: `qml.PhaseShift(${parameter()}, ${qmlWire(targetIndex)})`,
    };
  }

  if (gate === "u" || gate === "u3") {
    return {
      line: `qml.U3(${parameter(0)}, ${parameter(1)}, ${parameter(2)}, ${qmlWire(targetIndex)})`,
    };
  }

  if (gate === "u2") {
    return {
      line: `qml.U2(${parameter(0)}, ${parameter(1)}, ${qmlWire(targetIndex)})`,
    };
  }

  if (["cx", "cz", "cy", "ch"].includes(gate)) {
    const pair = pairWires(op);
    if (!pair) return { warning: `${gate} ${op.id}: missing control or target` };
    const operation = { cx: "CNOT", cz: "CZ", cy: "CY", ch: "CH" }[gate];
    return {
      line: `qml.${operation}(wires=[${pair[0]}, ${pair[1]}])`,
    };
  }

  if (gate === "swap") {
    const pair = pairWires(op);
    if (!pair) return { warning: `swap ${op.id}: missing target pair` };
    return { line: `qml.SWAP(wires=[${pair[0]}, ${pair[1]}])` };
  }

  if (gate === "ccx") {
    const controls = op.controls.map(qubitIndexFromId);
    if (controls.length < 2) {
      return { warning: `ccx ${op.id}: missing control pair` };
    }
    return {
      line: `qml.Toffoli(wires=[${controls[0]}, ${controls[1]}, ${targetIndex}])`,
    };
  }

  if (gate === "cu3" || gate === "cu") {
    const control = op.controls[0];
    if (!control || !op.targets[0]) {
      return { warning: `${gate} ${op.id}: needs control and target` };
    }
    const controlIndex = qubitIndexFromId(control);
    const targetIndex = qubitIndexFromId(op.targets[0]);
    const theta = parameter(0);
    const phi = parameter(1);
    const lam = parameter(2);
    const lines = [
      ...(gate === "cu"
        ? [`qml.PhaseShift(${parameter(3)}, wires=${controlIndex})`]
        : []),
      `qml.ctrl(qml.U3(${theta}, ${phi}, ${lam}, wires=${targetIndex}), control=${controlIndex})`,
    ];
    return { lines };
  }

  if (gate === "rccx" || gate === "rc3x") {
    const expectedControls = gate === "rccx" ? 2 : 3;
    if (op.controls.length < expectedControls || !op.targets[0]) {
      return {
        warning: `${gate} ${op.id}: needs ${expectedControls} controls and a target`,
      };
    }
    const controls = op.controls.map(qubitIndexFromId);
    const target = qubitIndexFromId(op.targets[0]);
    const quarter = "pi/4";
    const lines =
      gate === "rccx"
        ? [
            "# rccx (relative-phase Toffoli)",
            `qml.U2(0, pi, wires=${target})`,
            `qml.PhaseShift(${quarter}, wires=${target})`,
            `qml.CNOT(wires=[${controls[1]}, ${target}])`,
            `qml.PhaseShift(-${quarter}, wires=${target})`,
            `qml.CNOT(wires=[${controls[0]}, ${target}])`,
            `qml.PhaseShift(${quarter}, wires=${target})`,
            `qml.CNOT(wires=[${controls[1]}, ${target}])`,
            `qml.PhaseShift(-${quarter}, wires=${target})`,
            `qml.U2(0, pi, wires=${target})`,
          ]
        : [
            "# rc3x",
            `qml.U2(0, pi, wires=${target})`,
            `qml.PhaseShift(${quarter}, wires=${target})`,
            `qml.CNOT(wires=[${controls[2]}, ${target}])`,
            `qml.PhaseShift(-${quarter}, wires=${target})`,
            `qml.U2(0, pi, wires=${target})`,
            `qml.CNOT(wires=[${controls[0]}, ${target}])`,
            `qml.PhaseShift(${quarter}, wires=${target})`,
            `qml.CNOT(wires=[${controls[1]}, ${target}])`,
            `qml.PhaseShift(-${quarter}, wires=${target})`,
            `qml.CNOT(wires=[${controls[0]}, ${target}])`,
            `qml.PhaseShift(${quarter}, wires=${target})`,
            `qml.CNOT(wires=[${controls[1]}, ${target}])`,
            `qml.PhaseShift(-${quarter}, wires=${target})`,
            `qml.U2(0, pi, wires=${target})`,
            `qml.PhaseShift(${quarter}, wires=${target})`,
            `qml.CNOT(wires=[${controls[2]}, ${target}])`,
            `qml.PhaseShift(-${quarter}, wires=${target})`,
            `qml.U2(0, pi, wires=${target})`,
          ];
    return { lines };
  }

  if (gate === "cswap") {
    const targets = op.targets.map(qubitIndexFromId);
    const control = op.controls[0];
    if (!control || targets.length < 2) {
      return { warning: `cswap ${op.id}: missing control or target pair` };
    }
    return {
      line: `qml.CSWAP(wires=[${qubitIndexFromId(control)}, ${targets[0]}, ${targets[1]}])`,
    };
  }

  if (gate === "cp" || gate === "cu1") {
    const pair = pairWires(op);
    if (!pair) return { warning: `${gate} ${op.id}: missing control or target` };
    return {
      line: `qml.ControlledPhaseShift(${parameter()}, wires=[${pair[0]}, ${pair[1]}])`,
    };
  }

  if (gate === "crz") {
    const pair = pairWires(op);
    if (!pair) return { warning: `crz ${op.id}: missing control or target` };
    return {
      line: `qml.CRZ(${parameter()}, wires=[${pair[0]}, ${pair[1]}])`,
    };
  }

  if (gate === "rxx" || gate === "rzz") {
    const pair = pairWires(op);
    if (!pair) return { warning: `${gate} ${op.id}: missing target pair` };
    const operation = gate === "rxx" ? "IsingXX" : "IsingZZ";
    return {
      line: `qml.${operation}(${parameter()}, wires=[${pair[0]}, ${pair[1]}])`,
    };
  }

  return { warning: `Gate ${gate} is not supported by quantum-learn export` };
}

export function generatePennylaneAnsatz(
  circuit: Circuit
): PennylaneGenerateResult {
  try {
    const { names, symbols, features, maxFeatureIndex } = buildSymbolMap(circuit);
    const hasFeatures = features.size > 0;
    const lines = [
      '"""Ansatz exported from QCI Quantum Circuit Visualizer for quantum-learn.',
      "",
      "Symbolic circuit parameters become trainable entries of `params`",
      "(order: PARAM_NAMES). Numeric parameters are kept as constants.",
      "Symbols named x0, x1, … read the input features (features[i]); other symbols are trainable params.",
      '"""',
      "import pennylane as qml",
      "from numpy import pi",
      "",
      `N_QUBITS = ${circuit.qubits.length}`,
      `PARAM_NAMES = [${names.map((name) => `"${name}"`).join(", ")}]`,
      "N_PARAMS = len(PARAM_NAMES)",
      "",
      "",
      "def ansatz(features, params, n_qubits=N_QUBITS):",
      ...(hasFeatures
        ? []
        : [
            "    # Data encoding — remove if your circuit already encodes features",
            "    qml.AngleEmbedding(features, wires=range(n_qubits))",
          ]),
    ];

    if (names.length > 0) {
      lines.push(
        `    ${names.join(", ")} = ${names
          .map((_, index) => `params[${index}]`)
          .join(", ")}`
      );
    }

    const warnings: string[] = [];
    if (maxFeatureIndex >= circuit.qubits.length) {
      warnings.push(
        `Feature index x${maxFeatureIndex} exceeds N_QUBITS (${circuit.qubits.length}) — make sure your data has at least ${maxFeatureIndex + 1} columns`
      );
    }
    const sorted = [...circuit.operations].sort(
      (a, b) => a.column - b.column || a.id.localeCompare(b.id)
    );
    for (const op of sorted) {
      const emitted = emitGate(op, symbols, features);
      if ("line" in emitted) lines.push(`    ${emitted.line}`);
      else if ("lines" in emitted) {
        lines.push(...emitted.lines.map((line) => `    ${line}`));
      }
      else if (!warnings.includes(emitted.warning)) warnings.push(emitted.warning);
    }

    if (hasFeatures && names.length === 0) {
      lines.push(
        "",
        "",
        "def feature_map(features, n_qubits=N_QUBITS):",
        '    """quantum-learn QuantumFeatureMap-compatible (called as feature_map(row, qubits))."""',
        "    ansatz(features, [], n_qubits)",
        "",
        "",
        "# --- Use it as a feature map with quantum-learn ---",
        '# pip install "quantum-learn[pennylane]"',
        "import pandas as pd",
        "from qlearn import QuantumFeatureMap",
        "# X: pandas DataFrame with N_QUBITS feature columns",
        "# X_q = QuantumFeatureMap().transform(X, feature_map=feature_map, qubits=N_QUBITS)",
        ""
      );
    } else {
      lines.push(
        "",
        "",
        "# --- Train it with quantum-learn ---",
        '# pip install "quantum-learn[pennylane]"',
        "import numpy as np",
        "import pandas as pd",
        "from qlearn import VariationalQuantumClassifier",
        "",
        "clf = VariationalQuantumClassifier(",
        '    fit_kwargs={"n_qubits": N_QUBITS, "ansatz": ansatz},',
        ")",
        "# X_train: pandas DataFrame with N_QUBITS feature columns, y_train: pandas Series",
        "# params = np.random.uniform(0, 2 * pi, N_PARAMS)",
        "# clf.fit(X_train, y_train, params=params)",
        "# print(clf.predict(X_test))",
        ""
      );
    }

    return { success: true, code: lines.join("\n"), warnings };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "PennyLane generation failed",
    };
  }
}
