/**
 * Safe text-only Qiskit → Circuit IR parser.
 * Does NOT execute Python. Unsupported lines become warnings.
 */
import {
  Circuit,
  Operation,
  Parameter,
  generateOperationId,
  getGateLabel,
  qubitIdFromIndex,
  classicalBitIdFromIndex,
} from "./circuit-schema";
import {
  GATE_LIBRARY,
  formatParam,
  parseParamExpression,
} from "./translator-core";

export interface ParseResult {
  success: true;
  circuit: Circuit;
  warnings: string[];
}

export interface ParseError {
  success: false;
  error: string;
  warnings?: string[];
}

export type QiskitParseResult = ParseResult | ParseError;

const SUPPORTED_QISKIT_GATES = new Set([
  "h",
  "x",
  "y",
  "z",
  "s",
  "sdg",
  "t",
  "tdg",
  "id",
  "sx",
  "sxdg",
  "p",
  "rx",
  "ry",
  "rz",
  "u",
  "cx",
  "cz",
  "swap",
  "rxx",
  "rzz",
  "ccx",
  "rccx",
  "rc3x",
  "measure",
  "reset",
  "barrier",
]);

interface ParsedGateCall {
  gate: string;
  args: string[];
  raw: string;
  line: number;
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

function splitArgs(argsStr: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let bracket = 0;

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "[") bracket++;
    else if (ch === "]") bracket--;
    else if (ch === "," && depth === 0 && bracket === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Extract matching parentheses contents starting at openIdx pointing at '('. */
function extractParenContents(text: string, openIdx: number): { inner: string; end: number } | null {
  if (text[openIdx] !== "(") return null;
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") {
      depth--;
      if (depth === 0) {
        return { inner: text.slice(openIdx + 1, i), end: i };
      }
    }
  }
  return null;
}

function detectCircuitBinding(code: string): {
  varName: string;
  qubits: number;
  classicalBits: number;
} {
  const bind =
    /([A-Za-z_]\w*)\s*=\s*QuantumCircuit\s*\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?\)/;
  const match = code.match(bind);
  if (match) {
    return {
      varName: match[1],
      qubits: parseInt(match[2], 10),
      classicalBits: match[3] ? parseInt(match[3], 10) : 0,
    };
  }

  const bare = code.match(/QuantumCircuit\s*\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?\)/);
  if (bare) {
    return {
      varName: "qc",
      qubits: parseInt(bare[1], 10),
      classicalBits: bare[2] ? parseInt(bare[2], 10) : 0,
    };
  }

  throw new SyntaxError(
    "Could not find QuantumCircuit(n[, m]) declaration. Expected e.g. qc = QuantumCircuit(2, 2)"
  );
}

function parseListLiteral(expr: string): number[] | null {
  const trimmed = expr.trim();
  const m = trimmed.match(/^\[\s*(.*?)\s*\]$/);
  if (!m) return null;
  const inner = m[1].trim();
  if (!inner) return [];
  const parts = splitArgs(inner);
  const nums: number[] = [];
  for (const p of parts) {
    if (!/^-?\d+$/.test(p)) return null;
    nums.push(parseInt(p, 10));
  }
  return nums;
}

function isIndexToken(s: string): boolean {
  return /^-?\d+$/.test(s.trim());
}

function parseGateCalls(code: string, varName: string): { calls: ParsedGateCall[]; ignored: string[] } {
  const calls: ParsedGateCall[] = [];
  const ignored: string[] = [];
  const lines = code.split("\n");
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const callStart = new RegExp(`${escaped}\\.(\\w+)\\s*\\(`, "g");

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (
      /^(from|import)\b/.test(trimmed) ||
      trimmed.startsWith(varName + " =") ||
      /QuantumCircuit\s*\(/.test(trimmed)
    ) {
      continue;
    }

    callStart.lastIndex = 0;
    let foundOnLine = false;
    let match: RegExpExecArray | null;
    while ((match = callStart.exec(line)) !== null) {
      foundOnLine = true;
      const gate = match[1].toLowerCase();
      const openIdx = match.index + match[0].length - 1;
      const extracted = extractParenContents(line, openIdx);
      if (!extracted) {
        ignored.push(`Line ${lineIdx + 1}: unclosed call ${varName}.${gate}(...`);
        break;
      }
      calls.push({
        gate,
        args: splitArgs(extracted.inner),
        raw: line.trim(),
        line: lineIdx + 1,
      });
      callStart.lastIndex = extracted.end + 1;
    }

    if (!foundOnLine && /\w+\s*\(/.test(trimmed) && !trimmed.startsWith("#")) {
      // Likely an unsupported statement referencing another API
      if (trimmed.includes(".") || trimmed.includes("=")) {
        ignored.push(`Line ${lineIdx + 1}: unsupported or unrecognized — ${trimmed}`);
      }
    }
  }

  return { calls, ignored };
}

function evaluateParam(
  expr: string,
  warnings?: string[],
  line?: number
): Parameter {
  const display = expr.trim();
  try {
    const value = parseParamExpression(display);
    return { value, display: formatParam(value) === display ? formatParam(value) : display };
  } catch {
    const asFloat = Number(display);
    if (Number.isFinite(asFloat)) {
      return { value: asFloat, display: formatParam(asFloat) };
    }
    // Symbolic (theta, …) — keep display text; sim uses 0 until symbols are supported
    const msg = `symbolic parameter "${display}" is shown as-is but simulated as 0`;
    warnings?.push(line != null ? `Line ${line}: ${msg}` : msg);
    return { value: 0, display };
  }
}

function assertQubit(idx: number, numQubits: number, ctx: string) {
  if (!Number.isInteger(idx) || idx < 0 || idx >= numQubits) {
    throw new SyntaxError(`${ctx}: qubit index ${idx} out of range (0..${numQubits - 1})`);
  }
}

function assertClassical(idx: number, numClassical: number, ctx: string) {
  if (numClassical <= 0) {
    throw new SyntaxError(`${ctx}: circuit has no classical bits`);
  }
  if (!Number.isInteger(idx) || idx < 0 || idx >= numClassical) {
    throw new SyntaxError(
      `${ctx}: classical index ${idx} out of range (0..${numClassical - 1})`
    );
  }
}

function splitParamsAndIndices(
  gate: string,
  args: string[]
): { params: string[]; indices: number[] } {
  if (gate === "measure" || gate === "barrier" || gate === "reset") {
    return { params: [], indices: [] };
  }

  const info = GATE_LIBRARY[gate];
  const nParams = info?.nParams ?? 0;
  if (args.length < nParams) {
    throw new SyntaxError(`${gate} expects ${nParams} parameter(s)`);
  }

  const params = args.slice(0, nParams);
  const indexArgs = args.slice(nParams);
  const indices: number[] = [];
  for (const a of indexArgs) {
    if (!isIndexToken(a)) {
      throw new SyntaxError(`${gate}: expected qubit index, got ${a}`);
    }
    indices.push(parseInt(a, 10));
  }
  return { params, indices };
}

function gateToOperations(
  call: ParsedGateCall,
  column: number,
  numQubits: number,
  numClassical: number,
  warnings?: string[]
): Operation[] {
  const { gate, args } = call;

  if (!SUPPORTED_QISKIT_GATES.has(gate)) {
    throw new NotImplementedError(
      `Gate '${gate}' is not supported. Supported: ${[...SUPPORTED_QISKIT_GATES].join(", ")}`
    );
  }

  if (gate === "barrier") {
    let targets: string[];
    if (args.length === 0) {
      targets = Array.from({ length: numQubits }, (_, i) => qubitIdFromIndex(i));
    } else {
      const list = parseListLiteral(args[0]);
      const idxs = list ?? args.map((a) => {
        if (!isIndexToken(a)) throw new SyntaxError(`barrier: invalid qubit ${a}`);
        return parseInt(a, 10);
      });
      for (const idx of idxs) assertQubit(idx, numQubits, "barrier");
      targets = idxs.map(qubitIdFromIndex);
    }
    return [
      {
        id: generateOperationId(),
        type: "barrier",
        label: "‖",
        targets,
        controls: [],
        classicalTargets: [],
        column,
      },
    ];
  }

  if (gate === "measure") {
    if (args.length !== 2) {
      throw new SyntaxError("measure requires qubit and classical bit arguments");
    }
    const qList = parseListLiteral(args[0]);
    const cList = parseListLiteral(args[1]);
    if (qList && cList) {
      if (qList.length !== cList.length) {
        throw new SyntaxError("measure list lengths must match");
      }
      return qList.map((q, i) => {
        assertQubit(q, numQubits, "measure");
        assertClassical(cList[i], numClassical, "measure");
        return {
          id: generateOperationId(),
          type: "measure" as const,
          label: "M",
          targets: [qubitIdFromIndex(q)],
          controls: [],
          classicalTargets: [classicalBitIdFromIndex(cList[i])],
          column: column + i,
        };
      });
    }
    if (!isIndexToken(args[0]) || !isIndexToken(args[1])) {
      throw new SyntaxError("measure requires integer qubit and classical indices");
    }
    const q = parseInt(args[0], 10);
    const c = parseInt(args[1], 10);
    assertQubit(q, numQubits, "measure");
    assertClassical(c, numClassical, "measure");
    return [
      {
        id: generateOperationId(),
        type: "measure",
        label: "M",
        targets: [qubitIdFromIndex(q)],
        controls: [],
        classicalTargets: [classicalBitIdFromIndex(c)],
        column,
      },
    ];
  }

  if (gate === "reset") {
    if (args.length !== 1 || !isIndexToken(args[0])) {
      throw new SyntaxError("reset requires 1 qubit index");
    }
    const q = parseInt(args[0], 10);
    assertQubit(q, numQubits, "reset");
    return [
      {
        id: generateOperationId(),
        type: "reset",
        label: "|0⟩",
        targets: [qubitIdFromIndex(q)],
        controls: [],
        classicalTargets: [],
        column,
      },
    ];
  }

  const gateInfo = GATE_LIBRARY[gate];
  if (!gateInfo) {
    throw new NotImplementedError(`Gate '${gate}' is not in the gate library`);
  }

  const { params, indices } = splitParamsAndIndices(gate, args);
  if (indices.length !== gateInfo.nQubits) {
    throw new SyntaxError(`${gate} expects ${gateInfo.nQubits} qubit index(es)`);
  }
  for (const idx of indices) assertQubit(idx, numQubits, gate);

  const parameters =
    gateInfo.nParams > 0
      ? params.map((expr) => evaluateParam(expr, warnings, call.line))
      : undefined;

  if (gateInfo.nQubits === 1) {
    return [
      {
        id: generateOperationId(),
        type: gate,
        label: getGateLabel(gate),
        targets: [qubitIdFromIndex(indices[0])],
        controls: [],
        classicalTargets: [],
        column,
        parameters,
      },
    ];
  }

  if (gateInfo.nQubits === 2) {
    if (gate === "swap") {
      return [
        {
          id: generateOperationId(),
          type: "swap",
          label: getGateLabel("swap"),
          targets: [qubitIdFromIndex(indices[0]), qubitIdFromIndex(indices[1])],
          controls: [],
          classicalTargets: [],
          column,
          parameters,
        },
      ];
    }
    // Controlled two-qubit (cx, cz, rxx, rzz, …): control first, target second
    if (["rxx", "rzz"].includes(gate)) {
      return [
        {
          id: generateOperationId(),
          type: gate,
          label: getGateLabel(gate),
          targets: [qubitIdFromIndex(indices[1])],
          controls: [qubitIdFromIndex(indices[0])],
          classicalTargets: [],
          column,
          parameters,
        },
      ];
    }
    return [
      {
        id: generateOperationId(),
        type: gate,
        label: getGateLabel(gate),
        targets: [qubitIdFromIndex(indices[1])],
        controls: [qubitIdFromIndex(indices[0])],
        classicalTargets: [],
        column,
        parameters,
      },
    ];
  }

  if (gateInfo.nQubits === 3) {
    return [
      {
        id: generateOperationId(),
        type: gate,
        label: getGateLabel(gate),
        targets: [qubitIdFromIndex(indices[2])],
        controls: [qubitIdFromIndex(indices[0]), qubitIdFromIndex(indices[1])],
        classicalTargets: [],
        column,
        parameters,
      },
    ];
  }

  if (gateInfo.nQubits === 4) {
    return [
      {
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
      },
    ];
  }

  throw new NotImplementedError(`Unsupported arity for ${gate}`);
}

class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}

export function parseQiskitCode(code: string, name = "Imported Circuit"): QiskitParseResult {
  const warnings: string[] = [];
  try {
    const cleaned = stripComments(code);
    const { varName, qubits: numQubits, classicalBits: numClassical } =
      detectCircuitBinding(cleaned);

    if (numQubits < 1) {
      return { success: false, error: "QuantumCircuit must have at least 1 qubit" };
    }

    const { calls, ignored } = parseGateCalls(cleaned, varName);
    warnings.push(...ignored);

    const operations: Operation[] = [];
    let column = 0;

    for (const call of calls) {
      try {
        const ops = gateToOperations(call, column, numQubits, numClassical, warnings);
        operations.push(...ops);
        column += Math.max(ops.length, 1);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown gate error";
        if (err instanceof NotImplementedError) {
          warnings.push(`Line ${call.line}: ${message}`);
          continue;
        }
        // Hard errors (syntax / OOB) fail the parse
        return { success: false, error: `Line ${call.line}: ${message}`, warnings };
      }
    }

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
      operations,
      metadata: { source: "qiskit-parser", warnings },
    };

    return { success: true, circuit, warnings };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown parsing error occurred";
    return { success: false, error: message, warnings };
  }
}

export { NotImplementedError };
export { circuitToQasm } from "./openqasm-generator";
