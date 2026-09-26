import { describe, expect, it } from "vitest";
import {
  circuitSignature,
  computeStepSnapshots,
  explainStep,
} from "@/lib/step-explanations";
import { getExecutionLayers, getMaxInspectStep } from "@/lib/circuit-layout";
import { bellStateCircuit, hzhCircuit } from "@/lib/sample-circuits";
import { WALKTHROUGHS } from "@/lib/learning/walkthroughs";
import type { Circuit } from "@/lib/circuit-schema";

describe("step explanations", () => {
  it("computes Bell snapshots and detects entanglement", () => {
    const snapshots = computeStepSnapshots(bellStateCircuit);
    expect(snapshots).toHaveLength(3);
    const stepOne = Object.fromEntries(
      snapshots[1].after.probabilities.map((entry) => [
        entry.label,
        entry.probability,
      ])
    );
    const stepTwo = Object.fromEntries(
      snapshots[2].after.probabilities.map((entry) => [
        entry.label,
        entry.probability,
      ])
    );
    expect(stepOne["|00⟩"]).toBeCloseTo(0.5);
    expect(stepOne["|01⟩"]).toBeCloseTo(0.5);
    expect(stepTwo["|00⟩"]).toBeCloseTo(0.5);
    expect(stepTwo["|11⟩"]).toBeCloseTo(0.5);
    expect(explainStep(snapshots[2], bellStateCircuit).entangled).toBe(true);
  });

  it("reports a product state when the Bell CX is removed", () => {
    const circuit: Circuit = {
      ...bellStateCircuit,
      operations: [bellStateCircuit.operations[0]],
    };
    const snapshots = computeStepSnapshots(circuit);
    expect(explainStep(snapshots[1], circuit).entangled).toBe(false);
  });

  it("describes HZH as phase-only before the final interference", () => {
    const snapshots = computeStepSnapshots(hzhCircuit);
    const explanation = explainStep(snapshots[2], hzhCircuit);
    expect(explanation.phaseOnly).toBe(true);
    expect(snapshots[2].after.probabilities[0].probability).toBeCloseTo(0.5);
    expect(snapshots[2].after.probabilities[1].probability).toBeCloseTo(0.5);
    expect(explanation.computed.join(" ")).toContain("phases changed");
    expect(snapshots[3].after.probabilities[1].probability).toBeCloseTo(1);
  });

  it("caches snapshots by circuit signature", () => {
    const first = computeStepSnapshots(bellStateCircuit);
    expect(computeStepSnapshots(bellStateCircuit)).toBe(first);

    for (let index = 0; index < 9; index++) {
      computeStepSnapshots({
        ...bellStateCircuit,
        operations: bellStateCircuit.operations.map((operation) => ({
          ...operation,
          column: operation.column + index + 1,
        })),
      });
    }
    expect(computeStepSnapshots(bellStateCircuit)).not.toBe(first);
  });

  it("uses the same execution layers as inspect mode", () => {
    expect(getExecutionLayers(bellStateCircuit.operations).length).toBe(
      getMaxInspectStep(bellStateCircuit.operations)
    );
    expect(computeStepSnapshots(bellStateCircuit).length - 1).toBe(
      getMaxInspectStep(bellStateCircuit.operations)
    );
  });

  it("surfaces unbound parameters in the computed explanation", () => {
    const circuit: Circuit = {
      ...hzhCircuit,
      operations: [
        {
          ...hzhCircuit.operations[0],
          type: "rx",
          parameters: [{ value: 0, display: "theta", symbol: "theta" }],
        },
      ],
    };
    const explanation = explainStep(
      computeStepSnapshots(circuit)[1],
      circuit
    );
    expect(explanation.computed.join(" ")).toContain(
      "Unbound parameter theta"
    );
  });

  it("invalidates snapshots when operation ids or classical mappings change", () => {
    const measurement: Circuit = {
      ...hzhCircuit,
      classicalBits: [{ id: "c0", label: "c[0]" }],
      operations: [
        {
          ...hzhCircuit.operations[0],
          id: "measure-a",
          type: "measure",
          classicalTargets: ["c0"],
        },
      ],
    };
    const otherClassicalTarget = {
      ...measurement,
      operations: [
        { ...measurement.operations[0], classicalTargets: [] },
      ],
    };
    const otherId = {
      ...measurement,
      operations: [{ ...measurement.operations[0], id: "measure-b" }],
    };
    expect(circuitSignature(measurement)).not.toBe(
      circuitSignature(otherClassicalTarget)
    );
    expect(circuitSignature(measurement)).not.toBe(circuitSignature(otherId));
  });

  it("keeps walkthrough highlights aligned to execution layers", () => {
    for (const walkthrough of WALKTHROUGHS) {
      const max = getMaxInspectStep(walkthrough.circuit.operations);
      for (const step of walkthrough.steps) {
        if (step.inspectStep !== null) {
          expect(step.inspectStep).toBeLessThanOrEqual(max);
        }
      }
    }
  });
});
