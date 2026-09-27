import { describe, expect, it } from "vitest";
import { createEmptyCircuit, type Circuit } from "@/lib/circuit-schema";
import { decodeShareParam, encodeCircuitToShare } from "@/lib/share-link";

function sampleCircuit(): Circuit {
  const circuit = createEmptyCircuit("Symbolic Bell", 3, 1);
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

describe("share links", () => {
  it("round-trips parameterized and measured circuits", () => {
    const circuit = sampleCircuit();
    expect(decodeShareParam(encodeCircuitToShare(circuit))).toEqual(circuit);
  });

  it("rejects tampered input", () => {
    const encoded = encodeCircuitToShare(sampleCircuit());
    const tampered = `${encoded.slice(0, -1)}${encoded.endsWith("a") ? "b" : "a"}`;
    expect(decodeShareParam(tampered)).toBeNull();
    expect(decodeShareParam("d1.not-a-circuit")).toBeNull();
  });
});
