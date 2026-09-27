import type { Circuit } from "@/lib/circuit-schema";
import { validateCircuit } from "@/lib/validation";

const MAX_SHARE_BYTES = 32 * 1024;
const SHARE_VERSION = 1;

interface SharePayload {
  v: number;
  name: string;
  qubits: Circuit["qubits"];
  clbits: Circuit["classicalBits"];
  ops: Circuit["operations"];
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
      return Uint8Array.from(binary, (char) => char.charCodeAt(0));
    }
    return new Uint8Array(Buffer.from(normalized, "base64url"));
  } catch {
    return null;
  }
}

function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (const byte of bytes) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/**
 * Synchronous DEFLATE fallback using stored blocks. This keeps share-link
 * encoding available in static-export browsers without adding a dependency.
 */
function deflateStored(bytes: Uint8Array): Uint8Array {
  const output = [0x78, 0x01];
  for (let offset = 0; offset < bytes.length || offset === 0; ) {
    const length = Math.min(0xffff, bytes.length - offset);
    const final = offset + length >= bytes.length;
    output.push(final ? 0x01 : 0x00, length & 0xff, length >> 8);
    const inverse = (~length) & 0xffff;
    output.push(inverse & 0xff, inverse >> 8);
    output.push(...bytes.slice(offset, offset + length));
    offset += length;
  }
  const checksum = adler32(bytes);
  output.push(
    checksum >>> 24,
    (checksum >>> 16) & 0xff,
    (checksum >>> 8) & 0xff,
    checksum & 0xff
  );
  return Uint8Array.from(output);
}

function inflateStored(bytes: Uint8Array): Uint8Array | null {
  if (bytes.length < 6 || bytes[0] !== 0x78) return null;
  let offset = 2;
  const output: number[] = [];
  let final = false;
  while (!final) {
    if (offset + 5 > bytes.length) return null;
    const header = bytes[offset++];
    final = (header & 1) === 1;
    if ((header >> 1) & 0x03) return null;
    const length = bytes[offset] | (bytes[offset + 1] << 8);
    const inverse = bytes[offset + 2] | (bytes[offset + 3] << 8);
    offset += 4;
    if ((length ^ inverse) !== 0xffff || offset + length > bytes.length) {
      return null;
    }
    output.push(...bytes.slice(offset, offset + length));
    offset += length;
  }
  if (offset + 4 !== bytes.length) return null;
  const result = Uint8Array.from(output);
  const checksum =
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3];
  return (checksum >>> 0) === adler32(result) ? result : null;
}

function createPayload(circuit: Circuit): SharePayload {
  return {
    v: SHARE_VERSION,
    name: circuit.name,
    qubits: circuit.qubits,
    clbits: circuit.classicalBits,
    ops: circuit.operations,
  };
}

export function encodeCircuitToShare(circuit: Circuit): string {
  const json = JSON.stringify(createPayload(circuit));
  const bytes = new TextEncoder().encode(json);
  if (bytes.length > MAX_SHARE_BYTES) {
    throw new Error("Circuit is too large to share");
  }
  return `d${SHARE_VERSION}.${toBase64Url(deflateStored(bytes))}`;
}

export function decodeShareParam(param: string): Circuit | null {
  if (!param || param.length > MAX_SHARE_BYTES * 2) return null;
  try {
    const separator = param.indexOf(".");
    if (separator < 1) return null;
    const version = Number(param.slice(1, separator));
    if (!param.startsWith("d") || version !== SHARE_VERSION) return null;
    const compressed = fromBase64Url(param.slice(separator + 1));
    if (!compressed || compressed.length > MAX_SHARE_BYTES * 2) return null;
    const bytes = inflateStored(compressed);
    if (!bytes || bytes.length > MAX_SHARE_BYTES) return null;
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as Partial<SharePayload>;
    if (
      payload.v !== SHARE_VERSION ||
      typeof payload.name !== "string" ||
      !Array.isArray(payload.qubits) ||
      !Array.isArray(payload.clbits) ||
      !Array.isArray(payload.ops)
    ) {
      return null;
    }
    const validated = validateCircuit({
      name: payload.name,
      qubits: payload.qubits,
      classicalBits: payload.clbits,
      operations: payload.ops,
    });
    return validated.valid ? validated.circuit : null;
  } catch {
    return null;
  }
}
