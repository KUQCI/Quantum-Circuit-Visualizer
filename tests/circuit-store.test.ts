import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import {
  sliceHistoryForPersist,
  useCircuitStore,
} from "@/store/circuit-store";
import { validateCircuitPlacement } from "@/lib/validation";

const memoryStore = new Map<string, string>();

beforeEach(() => {
  memoryStore.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStore.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStore.delete(key);
    },
    clear: () => memoryStore.clear(),
    key: () => null,
    length: 0,
  });
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("dispatchEvent", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function resetCircuitStore() {
  useCircuitStore.getState().commitActivityToWorkspace();
  useCircuitStore.setState({
    circuit: createEmptyCircuit("Untitled Circuit", 2, 0),
    currentProjectId: null,
    selectedOperationId: null,
    clipboard: null,
    validationWarnings: [],
    history: [{ circuit: createEmptyCircuit("Untitled Circuit", 2, 0) }],
    historyIndex: 0,
    buildWorkspace: null,
    projects: [],
  });
}

function addGate(
  type: string,
  label: string,
  targets: string[],
  controls: string[] = [],
  column = 0
) {
  return useCircuitStore.getState().addOperation({
    type,
    label,
    targets,
    controls,
    classicalTargets: [],
    column,
  });
}

describe("sliceHistoryForPersist", () => {
  it("keeps historyIndex aligned when truncating mid-undo", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      circuit: createEmptyCircuit(`H${i}`, 1, 0),
    }));
    // User undid back to index 5; persist keeps last 10 (indices 10–19)
    const result = sliceHistoryForPersist(history, 5, 10);
    expect(result.history).toHaveLength(10);
    expect(result.history[0].circuit.name).toBe("H10");
    expect(result.historyIndex).toBe(0);
  });

  it("maps a near-end index into the truncated window", () => {
    const history = Array.from({ length: 15 }, (_, i) => ({
      circuit: createEmptyCircuit(`H${i}`, 1, 0),
    }));
    const result = sliceHistoryForPersist(history, 14, 10);
    expect(result.history).toHaveLength(10);
    expect(result.historyIndex).toBe(9);
  });
});

describe("circuit store register + measure safety", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetCircuitStore();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    resetCircuitStore();
  });

  it("adds measure and classical bit in a single undo step", () => {
    const store = useCircuitStore.getState();
    expect(store.circuit.classicalBits).toHaveLength(0);

    store.addMeasureOperation("q0", 0);
    const after = useCircuitStore.getState();
    expect(after.circuit.classicalBits).toHaveLength(1);
    expect(after.circuit.operations).toHaveLength(1);
    expect(after.circuit.operations[0].type).toBe("measure");

    after.undo();
    const undone = useCircuitStore.getState();
    expect(undone.circuit.classicalBits).toHaveLength(0);
    expect(undone.circuit.operations).toHaveLength(0);
  });

  it("sets and clears parameter bindings through history", () => {
    const store = useCircuitStore.getState();
    const initialHistoryIndex = store.historyIndex;

    store.setParameterBinding("theta", Math.PI / 2);
    let state = useCircuitStore.getState();
    expect(state.circuit.parameterBindings).toEqual({ theta: Math.PI / 2 });
    expect(state.historyIndex).toBe(initialHistoryIndex + 1);

    state.clearParameterBinding("theta");
    state = useCircuitStore.getState();
    expect(state.circuit.parameterBindings).toEqual({});
    expect(state.historyIndex).toBe(initialHistoryIndex + 2);

    state.undo();
    expect(useCircuitStore.getState().circuit.parameterBindings).toEqual({
      theta: Math.PI / 2,
    });
  });

  it("previews parameter bindings without adding history", () => {
    const store = useCircuitStore.getState();
    const initialHistoryLength = store.history.length;
    const initialHistoryIndex = store.historyIndex;

    store.previewParameterBinding("theta", Math.PI / 4);
    let state = useCircuitStore.getState();
    expect(state.circuit.parameterBindings).toEqual({ theta: Math.PI / 4 });
    expect(state.history.length).toBe(initialHistoryLength);
    expect(state.historyIndex).toBe(initialHistoryIndex);

    state.setParameterBinding("theta", Math.PI / 2);
    state = useCircuitStore.getState();
    expect(state.circuit.parameterBindings).toEqual({ theta: Math.PI / 2 });
    expect(state.history.length).toBe(initialHistoryLength + 1);
  });

  it("does not add history when left alignment changes no columns", () => {
    const before = useCircuitStore.getState();
    const historyLength = before.history.length;
    const historyIndex = before.historyIndex;

    before.alignOperationsLeft();

    const after = useCircuitStore.getState();
    expect(after.history).toHaveLength(historyLength);
    expect(after.historyIndex).toBe(historyIndex);
  });

  it("merges placement alignment into the add history entry", () => {
    addGate("h", "H", ["q0"]);
    const beforeAdd = useCircuitStore.getState();
    const operationId = addGate("x", "X", ["q0"], [], 2);
    const afterAdd = useCircuitStore.getState();
    const historyLength = afterAdd.history.length;
    const historyIndex = afterAdd.historyIndex;

    afterAdd.alignOperationsLeft({ mergeWithLastEntry: true });

    let afterAlign = useCircuitStore.getState();
    expect(afterAlign.history).toHaveLength(historyLength);
    expect(afterAlign.historyIndex).toBe(historyIndex);
    expect(
      afterAlign.circuit.operations.find(
        (operation) => operation.id === operationId
      )?.column
    ).toBe(1);

    afterAlign.undo();
    afterAlign = useCircuitStore.getState();
    expect(afterAlign.circuit.operations).toEqual(
      beforeAdd.circuit.operations
    );
    expect(afterAlign.historyIndex).toBe(beforeAdd.historyIndex);
  });

  it("records manual alignment as one history entry", () => {
    addGate("h", "H", ["q0"]);
    const operationId = addGate("x", "X", ["q0"], [], 2);
    const before = useCircuitStore.getState();

    before.alignOperationsLeft();

    const after = useCircuitStore.getState();
    expect(after.history).toHaveLength(before.history.length + 1);
    expect(after.historyIndex).toBe(before.historyIndex + 1);
    expect(
      after.circuit.operations.find(
        (operation) => operation.id === operationId
      )?.column
    ).toBe(1);
  });

  it("drops measure ops when their classical bit is removed", () => {
    const store = useCircuitStore.getState();
    store.addClassicalBit();
    store.addMeasureOperation("q0", 0, "c0");
    expect(useCircuitStore.getState().circuit.operations).toHaveLength(1);

    useCircuitStore.getState().removeClassicalBit("c0");
    const next = useCircuitStore.getState();
    expect(next.circuit.classicalBits).toHaveLength(0);
    expect(next.circuit.operations).toHaveLength(0);
  });

  it("restores Build circuit after leaving an activity", () => {
    const store = useCircuitStore.getState();
    store.addOperation({
      type: "h",
      label: "H",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 0,
    });
    expect(useCircuitStore.getState().circuit.operations).toHaveLength(1);

    const lesson = createEmptyCircuit("Lesson", 1, 0);
    store.enterActivityCircuit(lesson);
    expect(useCircuitStore.getState().circuit.name).toBe("Lesson");
    expect(useCircuitStore.getState().circuit.operations).toHaveLength(0);
    expect(useCircuitStore.getState().buildWorkspace).not.toBeNull();

    store.exitActivityCircuit();
    vi.runAllTimers();

    const restored = useCircuitStore.getState();
    expect(restored.buildWorkspace).toBeNull();
    expect(restored.circuit.operations).toHaveLength(1);
    expect(restored.circuit.operations[0].type).toBe("h");
  });

  it("flushes a pending activity exit synchronously", () => {
    const store = useCircuitStore.getState();
    store.addOperation({
      type: "h",
      label: "H",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 0,
    });
    const buildCircuit = structuredClone(useCircuitStore.getState().circuit);

    store.enterActivityCircuit(createEmptyCircuit("Lesson", 1, 0));
    store.exitActivityCircuit();
    store.flushActivityExit();

    const restored = useCircuitStore.getState();
    expect(restored.buildWorkspace).toBeNull();
    expect(restored.circuit).toEqual(buildCircuit);
  });

  it("keeps Build backup across nested activity mounts", () => {
    const store = useCircuitStore.getState();
    store.addOperation({
      type: "x",
      label: "X",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 0,
    });

    store.enterActivityCircuit(createEmptyCircuit("L1", 1, 0));
    store.exitActivityCircuit();
    store.enterActivityCircuit(createEmptyCircuit("L2", 1, 0));
    // Cancelled pending restore from L1 exit
    vi.runAllTimers();

    expect(useCircuitStore.getState().circuit.name).toBe("L2");
    expect(useCircuitStore.getState().buildWorkspace?.circuit.operations[0].type).toBe(
      "x"
    );

    store.exitActivityCircuit();
    vi.runAllTimers();
    expect(useCircuitStore.getState().circuit.operations[0].type).toBe("x");
  });

  it("save/open project round-trips circuit content", () => {
    const store = useCircuitStore.getState();
    store.addOperation({
      type: "h",
      label: "H",
      targets: ["q0"],
      controls: [],
      classicalTargets: [],
      column: 0,
    });
    const id = store.saveProject("QA Project");
    store.resetCircuit();
    expect(useCircuitStore.getState().circuit.operations).toHaveLength(0);

    const opened = useCircuitStore.getState().openProject(id);
    expect(opened).not.toBeNull();
    expect(useCircuitStore.getState().circuit.operations[0].type).toBe("h");
    expect(useCircuitStore.getState().circuit.name).toBe("QA Project");
  });

  it("renames the saved and live circuit names", () => {
    const firstCircuit = createEmptyCircuit("First", 1, 0);
    const secondCircuit = createEmptyCircuit("Second", 1, 0);
    const now = new Date().toISOString();
    useCircuitStore.setState({
      projects: [
        { id: "first", name: "First", circuit: firstCircuit, createdAt: now, updatedAt: now },
        { id: "second", name: "Second", circuit: secondCircuit, createdAt: now, updatedAt: now },
      ],
      currentProjectId: "first",
      circuit: firstCircuit,
    });

    useCircuitStore.getState().renameProject("second", "Renamed Second");
    let state = useCircuitStore.getState();
    expect(state.projects.find((p) => p.id === "second")?.circuit.name).toBe(
      "Renamed Second"
    );
    expect(state.circuit.name).toBe("First");

    state.renameProject("first", "Renamed First");
    state = useCircuitStore.getState();
    expect(state.projects.find((p) => p.id === "first")?.circuit.name).toBe(
      "Renamed First"
    );
    expect(state.circuit.name).toBe("Renamed First");
  });

  it("detaches the current project when an imported project replaces it", () => {
    const currentCircuit = createEmptyCircuit("Current", 1, 0);
    const importedCircuit = createEmptyCircuit("Imported", 1, 0);
    const now = new Date().toISOString();
    useCircuitStore.setState({
      projects: [
        {
          id: "p1",
          name: "Current",
          circuit: currentCircuit,
          createdAt: now,
          updatedAt: now,
        },
      ],
      currentProjectId: "p1",
    });

    useCircuitStore.getState().importProjects(
      [
        {
          id: "p1",
          name: "Imported",
          circuit: importedCircuit,
          createdAt: now,
          updatedAt: now,
        },
      ],
      "merge"
    );

    const state = useCircuitStore.getState();
    expect(state.currentProjectId).toBeNull();
    expect(state.projects[0]?.circuit.name).toBe("Imported");
  });
});

describe("circuit store placement conflicts", () => {
  beforeEach(() => {
    resetCircuitStore();
  });

  it("rejects an occupied add without changing history and accepts other slots", () => {
    addGate("h", "H", ["q0"]);
    const state = useCircuitStore.getState();
    const historyLength = state.history.length;
    const historyIndex = state.historyIndex;

    expect(addGate("x", "X", ["q0"])).toBeNull();
    expect(useCircuitStore.getState().circuit.operations).toHaveLength(1);
    expect(useCircuitStore.getState().history).toHaveLength(historyLength);
    expect(useCircuitStore.getState().historyIndex).toBe(historyIndex);

    expect(addGate("x", "X", ["q1"])).not.toBeNull();
    expect(addGate("x", "X", ["q0"], [], 1)).not.toBeNull();
    expect(useCircuitStore.getState().circuit.operations).toHaveLength(3);
  });

  it("does not add alignment history after a rejected add in an aligned circuit", () => {
    addGate("h", "H", ["q0"]);
    addGate("x", "X", ["q1"]);
    const before = useCircuitStore.getState();

    expect(addGate("y", "Y", ["q0"])).toBeNull();
    useCircuitStore.getState().alignOperationsLeft();

    const after = useCircuitStore.getState();
    expect(after.circuit.operations.map((operation) => operation.column)).toEqual([
      0,
      0,
    ]);
    expect(after.history).toHaveLength(before.history.length);
    expect(after.historyIndex).toBe(before.historyIndex);
  });

  it("rejects a two-qubit gate when its target wire is occupied", () => {
    addGate("x", "X", ["q1"]);

    expect(addGate("cx", "CX", ["q1"], ["q0"])).toBeNull();
    expect(useCircuitStore.getState().circuit.operations).toHaveLength(1);
  });

  it("rejects an occupied measurement before creating a classical bit", () => {
    addGate("h", "H", ["q0"]);
    const before = useCircuitStore.getState();
    const historyLength = before.history.length;
    const historyIndex = before.historyIndex;

    expect(useCircuitStore.getState().addMeasureOperation("q0", 0)).toBeNull();

    const after = useCircuitStore.getState();
    expect(after.circuit.operations).toHaveLength(1);
    expect(after.circuit.classicalBits).toHaveLength(0);
    expect(after.history).toHaveLength(historyLength);
    expect(after.historyIndex).toBe(historyIndex);
  });

  it("returns relocation status and preserves history for rejected placements", () => {
    addGate("h", "H", ["q0"]);
    addGate("x", "X", ["q1"], [], 1);
    const before = useCircuitStore.getState();
    const historyLength = before.history.length;
    const historyIndex = before.historyIndex;
    const hId = before.circuit.operations[0].id;

    expect(before.relocateOperation(hId, 1, 1)).toBe(false);
    let after = useCircuitStore.getState();
    expect(after.circuit.operations[0]).toMatchObject({
      id: hId,
      targets: ["q0"],
      column: 0,
    });
    expect(after.history).toHaveLength(historyLength);
    expect(after.historyIndex).toBe(historyIndex);

    expect(after.relocateOperation(hId, 2, 1)).toBe(true);
    after = useCircuitStore.getState();
    expect(after.circuit.operations[0]).toMatchObject({
      id: hId,
      targets: ["q1"],
      column: 2,
    });

    const movedHistoryLength = after.history.length;
    const movedHistoryIndex = after.historyIndex;
    expect(after.relocateOperation(hId, 2, 1)).toBe(false);
    expect(after.relocateOperation("missing", 2, 1)).toBe(false);
    after = useCircuitStore.getState();
    expect(after.history).toHaveLength(movedHistoryLength);
    expect(after.historyIndex).toBe(movedHistoryIndex);
  });

  it("does not record a same-slot relocation, so undo removes the last real edit", () => {
    addGate("h", "H", ["q0"]);
    addGate("x", "X", ["q1"]);
    const before = useCircuitStore.getState();
    const firstOperationId = before.circuit.operations[0].id;

    before.relocateOperation(firstOperationId, 0, 0);

    let after = useCircuitStore.getState();
    expect(after.history).toHaveLength(before.history.length);
    expect(after.historyIndex).toBe(before.historyIndex);

    after.undo();
    after = useCircuitStore.getState();
    expect(after.circuit.operations.map((operation) => operation.id)).toEqual([
      firstOperationId,
    ]);
    expect(after.historyIndex).toBe(before.historyIndex - 1);
  });

  it("rejects a move into an occupied slot without changing history", () => {
    addGate("h", "H", ["q0"]);
    addGate("x", "X", ["q0"], [], 1);
    const before = useCircuitStore.getState();
    const historyLength = before.history.length;
    const hId = before.circuit.operations[0].id;

    before.moveOperation(hId, 1);

    const after = useCircuitStore.getState();
    expect(after.circuit.operations[0]).toMatchObject({
      id: hId,
      column: 0,
    });
    expect(after.history).toHaveLength(historyLength);

    after.moveOperation(hId, 0);
    const afterNoOpMove = useCircuitStore.getState();
    expect(afterNoOpMove.history).toHaveLength(historyLength);
    expect(afterNoOpMove.historyIndex).toBe(after.historyIndex);
  });

  it("does not record relocating a swap to the same wires in reversed order", () => {
    const malformed = createEmptyCircuit("Overlapping swap", 2, 0);
    malformed.operations = [
      {
        id: "swap",
        type: "swap",
        label: "SWAP",
        targets: ["q1", "q0"],
        controls: [],
        classicalTargets: [],
        column: 0,
      },
    ];
    useCircuitStore.getState().setCircuit(malformed);
    const before = useCircuitStore.getState();

    before.relocateOperation("swap", 0, 0);

    const after = useCircuitStore.getState();
    expect(after.history).toHaveLength(before.history.length);
    expect(after.historyIndex).toBe(before.historyIndex);
    expect(
      after.circuit.operations.find((operation) => operation.id === "swap")
        ?.targets
    ).toEqual(["q1", "q0"]);
  });

  it("rejects paste into an occupied slot and accepts it in a free slot", () => {
    addGate("h", "H", ["q0"]);
    const state = useCircuitStore.getState();
    const operationId = state.circuit.operations[0].id;
    state.copyOperation(operationId);
    const before = useCircuitStore.getState();
    const historyLength = before.history.length;
    const clipboard = before.clipboard;

    expect(before.pasteOperation(0, 0)).toBeNull();

    const afterRejectedPaste = useCircuitStore.getState();
    expect(afterRejectedPaste.circuit.operations).toHaveLength(1);
    expect(afterRejectedPaste.history).toHaveLength(historyLength);
    expect(afterRejectedPaste.clipboard).toEqual(clipboard);

    expect(afterRejectedPaste.pasteOperation(1, 0)).not.toBeNull();
    const afterFreePaste = useCircuitStore.getState();
    expect(afterFreePaste.circuit.operations).toHaveLength(2);
    expect(afterFreePaste.history).toHaveLength(historyLength + 1);
    expect(afterFreePaste.clipboard).toEqual(clipboard);
  });

  it("rejects geometry updates but permits parameter updates on loaded overlaps", () => {
    addGate("h", "H", ["q0"]);
    addGate("x", "X", ["q1"]);
    const before = useCircuitStore.getState();
    const historyLength = before.history.length;
    const hId = before.circuit.operations[0].id;

    before.updateOperation(hId, { targets: ["q1"] });

    let after = useCircuitStore.getState();
    expect(after.circuit.operations[0].targets).toEqual(["q0"]);
    expect(after.history).toHaveLength(historyLength);

    const malformed = createEmptyCircuit("Overlapping", 2, 0);
    malformed.operations = [
      {
        id: "rx",
        type: "rx",
        label: "RX",
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: 0,
        parameters: [{ value: 0.5 }],
      },
      {
        id: "h",
        type: "h",
        label: "H",
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: 0,
      },
    ];
    useCircuitStore.getState().setCircuit(malformed);

    after = useCircuitStore.getState();
    expect(validateCircuitPlacement(after.circuit)).toContain(
      "Qubit q0 has overlapping gates at column 1"
    );
    expect(after.validationWarnings).toContain(
      "Qubit q0 has overlapping gates at column 1"
    );

    after.updateOperation("rx", { parameters: [{ value: 1.25 }] });
    expect(
      useCircuitStore
        .getState()
        .circuit.operations.find((operation) => operation.id === "rx")
        ?.parameters
    ).toEqual([{ value: 1.25 }]);
  });
});
