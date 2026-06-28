import { describe, expect, it } from "vitest";
import { APP_STORAGE_VERSION, APP_STORAGE_VERSION_KEY } from "@/lib/app-storage";
import { prepareCircuit } from "@/lib/circuit-guard";
import { createEmptyCircuit } from "@/lib/circuit-schema";

describe("app-storage contracts", () => {
  it("defines a monotonic storage version", () => {
    expect(APP_STORAGE_VERSION).toBeGreaterThan(0);
    expect(APP_STORAGE_VERSION_KEY).toContain("storage-version");
  });

  it("documents the repair path used during migration", () => {
    const badCircuit = createEmptyCircuit("Bad", 2, 0);
    badCircuit.operations = [
      {
        id: "bad",
        type: "h",
        label: "H",
        targets: ["q9"],
        controls: [],
        classicalTargets: [],
        column: 0,
      },
    ];

    const repaired = prepareCircuit(badCircuit);
    expect(repaired.operations).toHaveLength(0);
  });
});
