import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import {
  sliceHistoryForPersist,
  useCircuitStore,
} from "@/store/circuit-store";

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
});
