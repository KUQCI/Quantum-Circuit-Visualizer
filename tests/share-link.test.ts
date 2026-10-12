import { describe, expect, it } from "vitest";
import { createEmptyCircuit, type Circuit } from "@/lib/circuit-schema";
import {
  buildShareUrl,
  decodeShareParam,
  encodeCircuitToShare,
} from "@/lib/share-link";

function withoutIds(operation: Circuit["operations"][number]) {
  const { id, ...rest } = operation;
  void id;
  return rest;
}

function sampleCircuit(): Circuit {
  const circuit = createEmptyCircuit("Symbolic Bell", 3, 1);
  circuit.parameterBindings = { theta: Math.PI / 2 };
  circuit.operations = [
    {
      id: "h0",
      type: "h",
      label: "H",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 0,
    },
    {
      id: "rx1",
      type: "rx",
      label: "RX",
      targets: ["q1"],
      controls: [],
      classicalTargets: [],
      column: 1,
      parameters: [{ value: 0.5, display: "theta", symbol: "theta" }],
    },
    {
      id: "cx",
      type: "cx",
      label: "CX",
      targets: ["q2"],
      controls: ["q0"],
      classicalTargets: [],
      column: 2,
    },
    {
      id: "measure",
      type: "measure",
      label: "M",
      targets: ["q2"],
      controls: [],
      classicalTargets: ["c0"],
      column: 3,
    },
  ];
  return circuit;
}

function bellCircuit(): Circuit {
  const circuit = createEmptyCircuit("Bell", 2, 0);
  circuit.operations = [
    {
      id: "h0",
      type: "h",
      label: "H",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 0,
    },
    {
      id: "cx",
      type: "cx",
      label: "CX",
      targets: ["q1"],
      controls: ["q0"],
      classicalTargets: [],
      column: 1,
    },
  ];
  return circuit;
}

describe("share links", () => {
  it("round-trips parameterized and measured circuits", () => {
    const circuit = sampleCircuit();
    const decoded = decodeShareParam(encodeCircuitToShare(circuit));
    expect(decoded).not.toBeNull();
    expect(decoded?.name).toBe(circuit.name);
    expect(decoded?.qubits).toEqual(circuit.qubits);
    expect(decoded?.classicalBits).toEqual(circuit.classicalBits);
    expect(decoded?.operations.map(withoutIds)).toEqual(circuit.operations.map(withoutIds));
    expect(decoded?.operations.map((operation) => operation.id)).toEqual([
      "op_0",
      "op_1",
      "op_2",
      "op_3",
    ]);
    expect(decoded?.parameterBindings).toEqual({ theta: Math.PI / 2 });
  });

  it("builds share URLs that round-trip circuit operations and qubits", () => {
    const circuit = sampleCircuit();
    const url = buildShareUrl(circuit, "https://example.test");

    expect(url.startsWith("https://example.test")).toBe(true);
    expect(url).toContain("/editor?share=s1.");
    const decoded = decodeShareParam(new URL(url).searchParams.get("share")!);
    expect(decoded?.operations.map(withoutIds)).toEqual(
      circuit.operations.map(withoutIds)
    );
    expect(decoded?.qubits).toEqual(circuit.qubits);
  });

  it("throws when building a URL for an oversized circuit", () => {
    const circuit = bellCircuit();
    circuit.name = "x".repeat(32 * 1024);

    expect(() =>
      buildShareUrl(circuit, "https://example.test")
    ).toThrow("Circuit is too large to share");
  });

  it("decodes legacy payloads without parameter bindings", () => {
    const encoded = encodeCircuitToShare(bellCircuit());
    const payload = JSON.parse(
      Buffer.from(encoded.slice(encoded.indexOf(".") + 1), "base64url").toString()
    );
    delete payload.b;
    const legacy = `s1.${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;
    expect(decodeShareParam(legacy)?.parameterBindings).toBeUndefined();
  });

  it("drops invalid parameter bindings while keeping finite values", () => {
    const encoded = encodeCircuitToShare(bellCircuit());
    const payload = JSON.parse(
      Buffer.from(encoded.slice(encoded.indexOf(".") + 1), "base64url").toString()
    );
    payload.b = { theta: Math.PI, bad: "not-a-number", nan: null };
    const invalid = `s1.${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;
    expect(decodeShareParam(invalid)?.parameterBindings).toEqual({ theta: Math.PI });
  });

  it("rejects tampered input", () => {
    const encoded = encodeCircuitToShare(sampleCircuit());
    const tampered = `${encoded.slice(0, -1)}${encoded.endsWith("a") ? "b" : "a"}`;
    expect(decodeShareParam(tampered)).toBeNull();
    expect(decodeShareParam("d1.not-a-circuit")).toBeNull();
  });

  it("keeps a Bell circuit link under 120 characters", () => {
    expect(encodeCircuitToShare(bellCircuit()).length).toBeLessThan(120);
  });
});
