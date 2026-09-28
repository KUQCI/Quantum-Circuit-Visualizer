import type { Circuit, Operation, Parameter } from "@/lib/circuit-schema";
import { getGateLabel } from "@/lib/circuit-schema";
import { validateCircuit } from "@/lib/validation";

const MAX_SHARE_BYTES = 32 * 1024;
const SHARE_VERSION = 1;

type ShareParameter = [number, string?, string?];
type ShareOperation = [string, number[], number, ...unknown[]];

interface ShareLabels {
  q?: [number, string][];
  c?: [number, string][];
}

interface SharePayload {
  v: number;
  n: string;
  q: number;
  c: number;
  l?: ShareLabels;
  b?: Record<string, number>;
  o: ShareOperation[];
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa === "function") {
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return Buffer.from(bytes).toString("base64url");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    if (typeof atob === "function") {
      const binary = atob(padded);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      return toBase64Url(bytes) === value ? bytes : null;
    }
    const bytes = new Uint8Array(Buffer.from(normalized, "base64url"));
    return toBase64Url(bytes) === value ? bytes : null;
  } catch {
    return null;
  }
}

function parameterToTuple(parameter: Parameter): ShareParameter {
  const tuple: ShareParameter = [parameter.value];
  if (parameter.display !== undefined || parameter.symbol !== undefined) {
    tuple[1] = parameter.display;
  }
  if (parameter.symbol !== undefined) tuple[2] = parameter.symbol;
  return tuple;
}

function parameterFromTuple(value: unknown): Parameter | null {
  if (!Array.isArray(value) || typeof value[0] !== "number") return null;
  if (value.length > 1 && value[1] !== undefined && typeof value[1] !== "string") {
    return null;
  }
  if (value.length > 2 && value[2] !== undefined && typeof value[2] !== "string") {
    return null;
  }
  return {
    value: value[0],
    ...(value[1] !== undefined ? { display: value[1] } : {}),
    ...(value[2] !== undefined ? { symbol: value[2] } : {}),
  };
}

function indexForId(
  id: string,
  values: Circuit["qubits"] | Circuit["classicalBits"]
): number {
  return values.findIndex((value) => value.id === id);
}

function createLabels(
  values: Circuit["qubits"] | Circuit["classicalBits"],
  prefix: "q" | "c"
): [number, string][] | undefined {
  const labels = values.flatMap((value, index) => {
    const defaultLabel = `${prefix}[${index}]`;
    return value.label === defaultLabel ? [] : [[index, value.label] as [number, string]];
  });
  return labels.length > 0 ? labels : undefined;
}

function createOperation(
  operation: Operation,
  circuit: Circuit
): ShareOperation {
  const targets = operation.targets.map((id) => indexForId(id, circuit.qubits));
  const controls = operation.controls.map((id) => indexForId(id, circuit.qubits));
  const classicalTargets = operation.classicalTargets.map((id) =>
    indexForId(id, circuit.classicalBits)
  );
  const tuple: ShareOperation = [operation.type, targets, operation.column];

  if (
    controls.length > 0 ||
    (operation.parameters?.length ?? 0) > 0 ||
    classicalTargets.length > 0
  ) {
    tuple[3] = controls.length > 0 ? controls : null;
  }
  if ((operation.parameters?.length ?? 0) > 0 || classicalTargets.length > 0) {
    tuple[4] = operation.parameters?.map(parameterToTuple) ?? null;
  }
  if (classicalTargets.length > 0) tuple[5] = classicalTargets;

  const defaultLabel = getGateLabel(operation.type);
  if (operation.label !== defaultLabel || operation.metadata !== undefined) {
    tuple[6] = operation.label !== defaultLabel ? operation.label : undefined;
  }
  if (operation.metadata !== undefined) tuple[7] = operation.metadata;
  return tuple;
}

function createPayload(circuit: Circuit): SharePayload {
  const labels: ShareLabels = {
    q: createLabels(circuit.qubits, "q"),
    c: createLabels(circuit.classicalBits, "c"),
  };
  if (!labels.q) delete labels.q;
  if (!labels.c) delete labels.c;

  return {
    v: SHARE_VERSION,
    n: circuit.name,
    q: circuit.qubits.length,
    c: circuit.classicalBits.length,
    ...(Object.keys(labels).length > 0 ? { l: labels } : {}),
    ...(circuit.parameterBindings
      ? { b: circuit.parameterBindings }
      : {}),
    o: circuit.operations.map((operation) => createOperation(operation, circuit)),
  };
}

function readParameterBindings(
  value: unknown
): Record<string, number> | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const bindings: Record<string, number> = {};
  for (const [name, binding] of Object.entries(value)) {
    if (typeof binding === "number" && Number.isFinite(binding)) {
      bindings[name] = binding;
    }
  }
  return Object.keys(bindings).length > 0 ? bindings : undefined;
}

function readIndexes(value: unknown, count: number): number[] | null {
  if (!Array.isArray(value)) return null;
  if (
    value.some(
      (index) =>
        typeof index !== "number" ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= count
    )
  ) {
    return null;
  }
  return value;
}

function readLabels(
  value: unknown,
  count: number,
  prefix: "q" | "c"
): Record<number, string> | null {
  if (value === undefined) return {};
  if (!Array.isArray(value)) return null;
  const labels: Record<number, string> = {};
  for (const entry of value) {
    if (
      !Array.isArray(entry) ||
      entry.length !== 2 ||
      typeof entry[0] !== "number" ||
      !Number.isInteger(entry[0]) ||
      entry[0] < 0 ||
      entry[0] >= count ||
      typeof entry[1] !== "string" ||
      entry[1] === `${prefix}[${entry[0]}]`
    ) {
      return null;
    }
    labels[entry[0]] = entry[1];
  }
  return labels;
}

/**
 * Encode a compact versioned circuit payload as UTF-8 base64url.
 *
 * The payload stores register counts, only non-default register labels, and
 * operation tuples with deterministic register indexes and generated IDs.
 */
export function encodeCircuitToShare(circuit: Circuit): string {
  const json = JSON.stringify(createPayload(circuit));
  const bytes = new TextEncoder().encode(json);
  if (bytes.length > MAX_SHARE_BYTES) {
    throw new Error("Circuit is too large to share");
  }
  return `s${SHARE_VERSION}.${toBase64Url(bytes)}`;
}

export function decodeShareParam(param: string): Circuit | null {
  if (!param || param.length > MAX_SHARE_BYTES * 2) return null;
  try {
    const separator = param.indexOf(".");
    if (separator < 1) return null;
    const version = Number(param.slice(1, separator));
    if (!param.startsWith("s") || version !== SHARE_VERSION) return null;
    const bytes = fromBase64Url(param.slice(separator + 1));
    if (!bytes || bytes.length > MAX_SHARE_BYTES) return null;
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as Partial<SharePayload>;
    const qubitCount = payload.q;
    const classicalCount = payload.c;
    if (
      payload.v !== SHARE_VERSION ||
      typeof payload.n !== "string" ||
      typeof qubitCount !== "number" ||
      !Number.isInteger(qubitCount) ||
      qubitCount < 1 ||
      qubitCount > 64 ||
      typeof classicalCount !== "number" ||
      !Number.isInteger(classicalCount) ||
      classicalCount < 0 ||
      !Array.isArray(payload.o)
    ) {
      return null;
    }

    const validQubitCount = qubitCount;
    const validClassicalCount = classicalCount;
    const qubitLabels = readLabels(payload.l?.q, validQubitCount, "q");
    const classicalLabels = readLabels(payload.l?.c, validClassicalCount, "c");
    if (!qubitLabels || !classicalLabels) return null;
    const qubits = Array.from({ length: validQubitCount }, (_, index) => ({
      id: `q${index}`,
      label: qubitLabels[index] ?? `q[${index}]`,
    }));
    const classicalBits = Array.from({ length: validClassicalCount }, (_, index) => ({
      id: `c${index}`,
      label: classicalLabels[index] ?? `c[${index}]`,
    }));
    const parameterBindings = readParameterBindings(payload.b);

    const operations: Operation[] = [];
    for (const [index, tuple] of (payload.o as ShareOperation[]).entries()) {
      if (!Array.isArray(tuple) || typeof tuple[0] !== "string") return null;
      const targets = readIndexes(tuple[1], validQubitCount);
      if (
        !targets ||
        typeof tuple[2] !== "number" ||
        !Number.isInteger(tuple[2]) ||
        tuple[2] < 0
      ) {
        return null;
      }
      const controls =
        tuple[3] === null || tuple[3] === undefined
          ? []
          : readIndexes(tuple[3], validQubitCount);
      const parameterTuples =
        tuple[4] === null || tuple[4] === undefined ? [] : tuple[4];
      if (!controls || !Array.isArray(parameterTuples)) return null;
      const parameters = parameterTuples.map(parameterFromTuple);
      if (parameters.some((parameter) => parameter === null)) return null;
      const classicalTargets =
        tuple[5] === undefined
          ? []
          : readIndexes(tuple[5], validClassicalCount);
      if (!classicalTargets) return null;
      if (
        tuple[6] !== undefined &&
        tuple[6] !== null &&
        typeof tuple[6] !== "string"
      ) {
        return null;
      }
      if (
        tuple[7] !== undefined &&
        (typeof tuple[7] !== "object" || tuple[7] === null)
      ) {
        return null;
      }
      operations.push({
        id: `op_${index}`,
        type: tuple[0],
        label: tuple[6] ?? getGateLabel(tuple[0]),
        targets: targets.map((target) => `q${target}`),
        controls: controls.map((control) => `q${control}`),
        classicalTargets: classicalTargets.map((target) => `c${target}`),
        column: tuple[2] as number,
        ...(parameters.length > 0 ? { parameters: parameters as Parameter[] } : {}),
        ...(tuple[7] !== undefined
          ? { metadata: tuple[7] as Record<string, unknown> }
          : {}),
      });
    }

    const validated = validateCircuit({
      name: payload.n,
      qubits,
      classicalBits,
      operations,
      ...(parameterBindings ? { parameterBindings } : {}),
    });
    return validated.valid ? validated.circuit : null;
  } catch {
    return null;
  }
}
