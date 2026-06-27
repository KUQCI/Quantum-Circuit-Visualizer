import {
  Circuit,
  Operation,
  generateOperationId,
  getGateLabel,
  qubitIdFromIndex,
  classicalBitIdFromIndex,
} from "./circuit-schema";
import {
  GATE_LIBRARY,
  formatParam,
  parseParamExpression,
  tokenize,
  evalExpr,
  Token,
} from "./translator-core";

export interface ParseResult {
  success: true;
  circuit: Circuit;
}

export interface ParseError {
  success: false;
  error: string;
}

export type QiskitParseResult = ParseResult | ParseError;

const SUPPORTED_QISKIT_GATES = new Set([
  "h", "x", "y", "z", "s", "sdg", "t", "tdg", "id", "sx", "sxdg", "p",
  "rx", "ry", "rz", "u",
  "cx", "cz", "swap", "rxx", "rzz", "ccx", "rccx", "rc3x",
  "measure", "reset", "barrier",
]);

interface ParsedGateCall {
  gate: string;
  indices: number[];
  paramExprs: string[];
}

function stripComments(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("#");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join("\n");
}

function extractCircuitDimensions(code: string): { qubits: number; classicalBits: number } {
  const patterns = [
    /QuantumCircuit\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/,
    /QuantumCircuit\s*\(\s*(\d+)\s*\)/,
  ];

  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match) {
      return {
        qubits: parseInt(match[1], 10),
        classicalBits: match[2] ? parseInt(match[2], 10) : 0,
      };
    }
  }

  throw new SyntaxError(
    "Could not find QuantumCircuit(n[, m]) declaration. Expected e.g. QuantumCircuit(2, 2)"
  );
}

function parseGateArguments(argsStr: string): {
  indices: number[];
  paramExprs: string[];
} {
  const trimmed = argsStr.trim();
  if (!trimmed) return { indices: [], paramExprs: [] };

  const parts = splitArgs(trimmed).map((p) => p.trim());
  const paramExprs: string[] = [];
  const indices: number[] = [];

  for (const part of parts) {
    if (isNumericIndex(part)) {
      indices.push(parseInt(part, 10));
    } else {
      paramExprs.push(part);
    }
  }

  return { indices, paramExprs };
}

function isNumericIndex(s: string): boolean {
  return /^-?\d+$/.test(s.trim());
}

function splitArgs(argsStr: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function parseGateCalls(code: string): ParsedGateCall[] {
  const calls: ParsedGateCall[] = [];
  const gatePattern = /(?:qc|circuit)\.(\w+)\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;

  while ((match = gatePattern.exec(code)) !== null) {
    const gate = match[1].toLowerCase();
    const argsStr = match[2];

    if (gate === "barrier") {
      calls.push({ gate, indices: [], paramExprs: [] });
      continue;
    }

    const parsed = parseGateArguments(argsStr);
    calls.push({
      gate,
      indices: parsed.indices,
      paramExprs: parsed.paramExprs,
    });
  }

  return calls;
}

function evaluateParam(expr: string): { value: number; display: string } {
  try {
    const value = parseParamExpression(expr);
    return { value, display: formatParam(value) };
  } catch {
    try {
      const value = parseFloat(expr);
      if (!isNaN(value)) return { value, display: formatParam(value) };
    } catch {
      /* fall through */
    }
    throw new SyntaxError(`Invalid parameter expression: ${expr}`);
  }
}

function gateToOperation(
  call: ParsedGateCall,
  column: number,
  numQubits: number,
  _numClassical: number
): Operation {
  const { gate, indices, paramExprs } = call;

  if (!SUPPORTED_QISKIT_GATES.has(gate)) {
    throw new NotImplementedError(
      `Gate '${gate}' is not supported. Supported gates: ${[...SUPPORTED_QISKIT_GATES].join(", ")}`
    );
  }

  if (gate === "barrier") {
    return {
      id: generateOperationId(),
      type: "barrier",
      label: "‖",
      targets: Array.from({ length: numQubits }, (_, i) => qubitIdFromIndex(i)),
      controls: [],
      classicalTargets: [],
      column,
    };
  }

  if (gate === "measure") {
    if (indices.length < 2) {
      throw new SyntaxError("measure requires qubit and classical bit indices");
    }
    return {
      id: generateOperationId(),
      type: "measure",
      label: "M",
      targets: [qubitIdFromIndex(indices[0])],
      controls: [],
      classicalTargets: [classicalBitIdFromIndex(indices[1])],
      column,
    };
  }

  if (gate === "reset") {
    if (indices.length !== 1) {
      throw new SyntaxError("reset requires 1 qubit index");
    }
    return {
      id: generateOperationId(),
      type: "reset",
      label: "|0⟩",
      targets: [qubitIdFromIndex(indices[0])],
      controls: [],
      classicalTargets: [],
      column,
    };
  }

  const gateInfo = GATE_LIBRARY[gate];
  if (!gateInfo) {
    throw new NotImplementedError(`Gate '${gate}' is not in the gate library`);
  }

  if (gateInfo.nParams > 0 && paramExprs.length !== gateInfo.nParams) {
    throw new SyntaxError(`${gate} expects ${gateInfo.nParams} parameter(s)`);
  }

  const parameters =
    gateInfo.nParams > 0
      ? paramExprs.map((expr) => evaluateParam(expr))
      : undefined;

  if (gateInfo.nQubits === 1) {
    const qIdx = paramExprs.length > 0 ? indices[0] : indices[0];
    if (indices.length !== 1) {
      throw new SyntaxError(`${gate} expects 1 qubit target`);
    }
    return {
      id: generateOperationId(),
      type: gate,
      label: getGateLabel(gate),
      targets: [qubitIdFromIndex(qIdx)],
      controls: [],
      classicalTargets: [],
      column,
      parameters,
    };
  }

  if (gateInfo.nQubits === 2) {
    if (indices.length !== 2) {
      throw new SyntaxError(`${gate} expects 2 qubit indices`);
    }
    if (gate === "swap") {
      return {
        id: generateOperationId(),
        type: gate,
        label: getGateLabel(gate),
        targets: [qubitIdFromIndex(indices[0]), qubitIdFromIndex(indices[1])],
        controls: [],
        classicalTargets: [],
        column,
        parameters,
      };
    }
    return {
      id: generateOperationId(),
      type: gate,
      label: getGateLabel(gate),
      targets: [qubitIdFromIndex(indices[1])],
      controls: [qubitIdFromIndex(indices[0])],
      classicalTargets: [],
      column,
      parameters,
    };
  }

  if (gateInfo.nQubits === 3) {
    if (indices.length !== 3) {
      throw new SyntaxError(`${gate} expects 3 qubit indices`);
    }
    return {
      id: generateOperationId(),
      type: gate,
      label: getGateLabel(gate),
      targets: [qubitIdFromIndex(indices[2])],
      controls: [qubitIdFromIndex(indices[0]), qubitIdFromIndex(indices[1])],
      classicalTargets: [],
      column,
      parameters,
    };
  }

  if (gateInfo.nQubits === 4) {
    if (indices.length !== 4) {
      throw new SyntaxError(`${gate} expects 4 qubit indices`);
    }
    return {
      id: generateOperationId(),
      type: gate,
      label: getGateLabel(gate),
      targets: [qubitIdFromIndex(indices[3])],
      controls: [
        qubitIdFromIndex(indices[0]),
        qubitIdFromIndex(indices[1]),
        qubitIdFromIndex(indices[2]),
      ],
      classicalTargets: [],
      column,
      parameters,
    };
  }

  throw new NotImplementedError(`Multi-qubit gate ${gate} with ${gateInfo.nQubits} qubits not supported`);
}

class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}

export function parseQiskitCode(code: string, name = "Imported Circuit"): QiskitParseResult {
  try {
    const cleaned = stripComments(code);
    const { qubits: numQubits, classicalBits: numClassical } =
      extractCircuitDimensions(cleaned);
    const gateCalls = parseGateCalls(cleaned);

    const circuit: Circuit = {
      name,
      qubits: Array.from({ length: numQubits }, (_, i) => ({
        id: qubitIdFromIndex(i),
        label: `q[${i}]`,
      })),
      classicalBits: Array.from({ length: numClassical }, (_, i) => ({
        id: classicalBitIdFromIndex(i),
        label: `c[${i}]`,
      })),
      operations: gateCalls.map((call, idx) =>
        gateToOperation(call, idx, numQubits, numClassical)
      ),
    };

    return { success: true, circuit };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown parsing error occurred";
    return { success: false, error: message };
  }
}

export { NotImplementedError };
export { circuitToQasm } from "./openqasm-generator";
