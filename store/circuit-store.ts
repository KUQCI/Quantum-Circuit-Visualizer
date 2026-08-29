"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Circuit,
  Operation,
  createEmptyCircuit,
  generateOperationId,
  getGateLabel,
} from "@/lib/circuit-schema";
import { generateQiskitCode } from "@/lib/qiskit-generator";
import { prepareCircuit, prepareHistory } from "@/lib/circuit-guard";
import { runAppStorageMigrations } from "@/lib/app-storage";
import { validateCircuit, validateCircuitPlacement } from "@/lib/validation";
import { applyLeftAlignment } from "@/lib/circuit-layout";
import { useProgressStore } from "@/store/progress-store";
import {
  asNumber,
  createSafeJsonStorage,
} from "@/lib/safe-persist";

export interface Project {
  id: string;
  name: string;
  circuit: Circuit;
  createdAt: string;
  updatedAt: string;
}

interface HistoryEntry {
  circuit: Circuit;
}

/** Snapshot of the Build workspace while a lesson/challenge is active. */
interface BuildWorkspaceSnapshot {
  circuit: Circuit;
  currentProjectId: string | null;
  history: HistoryEntry[];
  historyIndex: number;
}

interface CircuitState {
  circuit: Circuit;
  currentProjectId: string | null;
  selectedOperationId: string | null;
  clipboard: Operation | null;
  validationWarnings: string[];
  history: HistoryEntry[];
  historyIndex: number;
  /** Non-persisted Build backup while Learn/Challenge is mounted. */
  buildWorkspace: BuildWorkspaceSnapshot | null;

  setCircuit: (circuit: Circuit) => void;
  /** Load a lesson/challenge circuit without binding to a saved project. */
  setActivityCircuit: (circuit: Circuit) => void;
  /**
   * Enter Learn/Challenge: backup Build once, then load the activity circuit.
   * Nested enters (lesson→lesson) keep the original Build backup.
   */
  enterActivityCircuit: (circuit: Circuit) => void;
  /** Leave Learn/Challenge and restore Build when no activity remains mounted. */
  exitActivityCircuit: () => void;
  /** Keep the current activity circuit as Build (e.g. Open in Build). */
  commitActivityToWorkspace: () => void;
  resetCircuit: () => void;
  setSelectedOperation: (id: string | null) => void;

  addQubit: () => void;
  removeQubit: (qubitId: string) => void;
  addClassicalBit: () => void;
  removeClassicalBit: (bitId: string) => void;
  setRegisterCounts: (qubits: number, classicalBits: number) => void;

  addOperation: (operation: Omit<Operation, "id">) => void;
  /** Add measure and auto-create c[0] in a single undo step when needed. */
  addMeasureOperation: (
    qubitId: string,
    column: number,
    classicalBitId?: string
  ) => void;
  updateOperation: (id: string, updates: Partial<Operation>) => void;
  removeOperation: (id: string) => void;
  moveOperation: (id: string, column: number) => void;
  copyOperation: (id: string) => void;
  pasteOperation: (column: number, qubitIndex: number) => void;
  alignOperationsLeft: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  getGeneratedCode: () => string;
  getValidationWarnings: () => string[];

  projects: Project[];
  loadProjects: () => void;
  saveProject: (name?: string) => string;
  openProject: (id: string) => Circuit | null;
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => void;
  deleteProject: (id: string) => void;
}

const PROJECTS_KEY = "qiskit-visualizer-projects";

if (typeof window !== "undefined") {
  runAppStorageMigrations();
}

function pushHistory(state: CircuitState): Partial<CircuitState> {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push({ circuit: structuredClone(state.circuit) });
  if (newHistory.length > 50) newHistory.shift();
  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
    validationWarnings: validateCircuitPlacement(state.circuit),
  };
}

/** Keep history/index aligned when truncating for persist. */
export function sliceHistoryForPersist(
  history: HistoryEntry[],
  historyIndex: number,
  maxEntries = 10
): { history: HistoryEntry[]; historyIndex: number } {
  const start = Math.max(0, history.length - maxEntries);
  const sliced = history.slice(-maxEntries);
  const adjusted = Math.min(
    Math.max(0, historyIndex - start),
    Math.max(0, sliced.length - 1)
  );
  return { history: sliced, historyIndex: adjusted };
}

let activityMountCount = 0;
let pendingActivityExit: ReturnType<typeof setTimeout> | null = null;

function clearPendingActivityExit() {
  if (pendingActivityExit !== null) {
    clearTimeout(pendingActivityExit);
    pendingActivityExit = null;
  }
}

function loadProjectsFromStorage(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const projects: Project[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const record = item as Partial<Project>;
      if (typeof record.id !== "string" || typeof record.name !== "string") continue;
      const circuitResult = validateCircuit(record.circuit);
      if (!circuitResult.valid) continue;
      projects.push({
        id: record.id,
        name: record.name,
        circuit: prepareCircuit(circuitResult.circuit),
        createdAt:
          typeof record.createdAt === "string"
            ? record.createdAt
            : new Date().toISOString(),
        updatedAt:
          typeof record.updatedAt === "string"
            ? record.updatedAt
            : new Date().toISOString(),
      });
    }
    return projects;
  } catch {
    return [];
  }
}

function saveProjectsToStorage(projects: Project[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    /* QuotaExceeded — fail silently */
  }
}

export function circuitHasContent(circuit: Circuit): boolean {
  const blankName = /^untitled circuit$/i.test(circuit.name.trim());
  return (
    circuit.operations.length > 0 ||
    !blankName ||
    circuit.qubits.length !== 2 ||
    circuit.classicalBits.length > 0
  );
}

export const useCircuitStore = create<CircuitState>()(
  persist(
    (set, get) => ({
      circuit: createEmptyCircuit("Untitled Circuit", 2, 0),
      currentProjectId: null,
      selectedOperationId: null,
      clipboard: null,
      validationWarnings: [],
      history: [{ circuit: createEmptyCircuit("Untitled Circuit", 2, 0) }],
      historyIndex: 0,
      buildWorkspace: null,
      projects: [],

      setCircuit: (circuit) => {
        const safe = prepareCircuit(circuit, { fallbackName: circuit.name });
        set((state) => ({
          circuit: safe,
          ...pushHistory({ ...state, circuit: safe }),
        }));
      },

      setActivityCircuit: (circuit) => {
        const safe = prepareCircuit(circuit, { fallbackName: circuit.name });
        set((state) => ({
          circuit: safe,
          currentProjectId: null,
          selectedOperationId: null,
          ...pushHistory({ ...state, circuit: safe }),
        }));
      },

      enterActivityCircuit: (circuit) => {
        clearPendingActivityExit();
        activityMountCount += 1;
        const safe = prepareCircuit(circuit, { fallbackName: circuit.name });
        set((state) => {
          const buildWorkspace =
            state.buildWorkspace ??
            ({
              circuit: structuredClone(state.circuit),
              currentProjectId: state.currentProjectId,
              history: structuredClone(state.history),
              historyIndex: state.historyIndex,
            } satisfies BuildWorkspaceSnapshot);

          return {
            buildWorkspace,
            circuit: safe,
            currentProjectId: null,
            selectedOperationId: null,
            history: [{ circuit: structuredClone(safe) }],
            historyIndex: 0,
            validationWarnings: validateCircuitPlacement(safe),
          };
        });
      },

      exitActivityCircuit: () => {
        activityMountCount = Math.max(0, activityMountCount - 1);
        if (activityMountCount > 0) return;

        clearPendingActivityExit();
        pendingActivityExit = setTimeout(() => {
          pendingActivityExit = null;
          if (activityMountCount > 0) return;
          set((state) => {
            const backup = state.buildWorkspace;
            if (!backup) return state;
            const circuit = prepareCircuit(backup.circuit);
            return {
              buildWorkspace: null,
              circuit,
              currentProjectId: backup.currentProjectId,
              selectedOperationId: null,
              history:
                backup.history.length > 0
                  ? backup.history
                  : [{ circuit: structuredClone(circuit) }],
              historyIndex: Math.min(
                Math.max(0, backup.historyIndex),
                Math.max(0, backup.history.length - 1)
              ),
              validationWarnings: validateCircuitPlacement(circuit),
            };
          });
        }, 0);
      },

      commitActivityToWorkspace: () => {
        clearPendingActivityExit();
        activityMountCount = 0;
        set({ buildWorkspace: null });
      },

      resetCircuit: () => {
        const circuit = createEmptyCircuit("Untitled Circuit", 2, 0);
        set((state) => ({
          circuit,
          currentProjectId: null,
          selectedOperationId: null,
          buildWorkspace: null,
          ...pushHistory({ ...state, circuit }),
        }));
      },

      setSelectedOperation: (id) => set({ selectedOperationId: id }),

      addQubit: () => {
        set((state) => {
          const idx = state.circuit.qubits.length;
          const circuit: Circuit = {
            ...state.circuit,
            qubits: [
              ...state.circuit.qubits,
              { id: `q${idx}`, label: `q[${idx}]` },
            ],
          };
          return { circuit, ...pushHistory({ ...state, circuit }) };
        });
      },

      removeQubit: (qubitId) => {
        set((state) => {
          const idx = parseInt(qubitId.replace("q", ""), 10);

          const remapQubit = (id: string): string | null => {
            if (id === qubitId) return null;
            const origIdx = parseInt(id.replace("q", ""), 10);
            const newIdx = origIdx > idx ? origIdx - 1 : origIdx;
            return `q${newIdx}`;
          };

          const circuit: Circuit = {
            ...state.circuit,
            qubits: state.circuit.qubits
              .filter((q) => q.id !== qubitId)
              .map((_, i) => ({ id: `q${i}`, label: `q[${i}]` })),
            operations: state.circuit.operations
              .filter(
                (op) =>
                  !op.targets.includes(qubitId) &&
                  !op.controls.includes(qubitId)
              )
              .map((op) => ({
                ...op,
                targets: op.targets
                  .map(remapQubit)
                  .filter((t): t is string => t !== null),
                controls: op.controls
                  .map(remapQubit)
                  .filter((c): c is string => c !== null),
              })),
          };
          return { circuit, ...pushHistory({ ...state, circuit }) };
        });
      },

      addClassicalBit: () => {
        set((state) => {
          const idx = state.circuit.classicalBits.length;
          const circuit: Circuit = {
            ...state.circuit,
            classicalBits: [
              ...state.circuit.classicalBits,
              { id: `c${idx}`, label: `c[${idx}]` },
            ],
          };
          return { circuit, ...pushHistory({ ...state, circuit }) };
        });
      },

      removeClassicalBit: (bitId) => {
        set((state) => {
          const idx = parseInt(bitId.replace("c", ""), 10);
          const remapped = state.circuit.operations.map((op) => ({
            ...op,
            classicalTargets: op.classicalTargets
              .filter((t) => t !== bitId)
              .map((t) => {
                const origIdx = parseInt(t.replace("c", ""), 10);
                const newIdx = origIdx > idx ? origIdx - 1 : origIdx;
                return `c${newIdx}`;
              }),
          }));
          const circuit: Circuit = {
            ...state.circuit,
            classicalBits: state.circuit.classicalBits
              .filter((c) => c.id !== bitId)
              .map((_, i) => ({ id: `c${i}`, label: `c[${i}]` })),
            operations: remapped.filter((op) => {
              if (op.type === "measure" && op.classicalTargets.length === 0) {
                return false;
              }
              return true;
            }),
          };
          return { circuit, ...pushHistory({ ...state, circuit }) };
        });
      },

      setRegisterCounts: (numQubits, numClassicalBits) => {
        set((state) => {
          let circuit = structuredClone(state.circuit);
          circuit.qubits = Array.from({ length: Math.max(1, numQubits) }, (_, i) => ({
            id: `q${i}`,
            label: `q[${i}]`,
          }));
          circuit.classicalBits = Array.from(
            { length: Math.max(0, numClassicalBits) },
            (_, i) => ({ id: `c${i}`, label: `c[${i}]` })
          );
          circuit.operations = circuit.operations.filter((op) => {
            const maxQ = circuit.qubits.length;
            const allQubits = [...op.targets, ...op.controls].every((id) => {
              const idx = parseInt(id.replace("q", ""), 10);
              return idx >= 0 && idx < maxQ;
            });
            const allClassical = op.classicalTargets.every((id) => {
              const idx = parseInt(id.replace("c", ""), 10);
              return idx >= 0 && idx < circuit.classicalBits.length;
            });
            return allQubits && allClassical;
          });
          return { circuit, ...pushHistory({ ...state, circuit }) };
        });
      },

      addOperation: (operation) => {
        set((state) => {
          const op: Operation = { ...operation, id: generateOperationId() };
          const circuit: Circuit = {
            ...state.circuit,
            operations: [...state.circuit.operations, op],
          };
          return { circuit, ...pushHistory({ ...state, circuit }) };
        });
      },

      addMeasureOperation: (qubitId, column, classicalBitId) => {
        set((state) => {
          let classicalBits = state.circuit.classicalBits;
          let resolvedClassical = classicalBitId;

          if (!resolvedClassical) {
            if (classicalBits.length === 0) {
              classicalBits = [{ id: "c0", label: "c[0]" }];
              resolvedClassical = "c0";
            } else {
              const qIdx = parseInt(qubitId.replace("q", ""), 10);
              const cIdx = Number.isFinite(qIdx)
                ? Math.min(Math.max(0, qIdx), classicalBits.length - 1)
                : 0;
              resolvedClassical = `c${cIdx}`;
            }
          }

          const op: Operation = {
            ...createOperationFromGateType(
              "measure",
              [qubitId],
              [],
              column,
              [resolvedClassical]
            ),
            id: generateOperationId(),
          };

          const circuit: Circuit = {
            ...state.circuit,
            classicalBits,
            operations: [...state.circuit.operations, op],
          };
          return {
            circuit,
            selectedOperationId: op.id,
            ...pushHistory({ ...state, circuit }),
          };
        });
      },

      updateOperation: (id, updates) => {
        set((state) => {
          const circuit: Circuit = {
            ...state.circuit,
            operations: state.circuit.operations.map((op) =>
              op.id === id ? { ...op, ...updates } : op
            ),
          };
          return { circuit, ...pushHistory({ ...state, circuit }) };
        });
      },

      removeOperation: (id) => {
        set((state) => {
          const circuit: Circuit = {
            ...state.circuit,
            operations: state.circuit.operations.filter((op) => op.id !== id),
          };
          return {
            circuit,
            selectedOperationId:
              state.selectedOperationId === id ? null : state.selectedOperationId,
            ...pushHistory({ ...state, circuit }),
          };
        });
      },

      moveOperation: (id, column) => {
        set((state) => {
          const circuit: Circuit = {
            ...state.circuit,
            operations: state.circuit.operations.map((op) =>
              op.id === id ? { ...op, column: Math.max(0, column) } : op
            ),
          };
          return { circuit, ...pushHistory({ ...state, circuit }) };
        });
      },

      copyOperation: (id) => {
        const op = get().circuit.operations.find((o) => o.id === id);
        if (op) set({ clipboard: structuredClone(op) });
      },

      pasteOperation: (column, qubitIndex) => {
        const { clipboard, circuit } = get();
        if (!clipboard) return;

        const wireIds = [...clipboard.targets, ...clipboard.controls];
        if (wireIds.length === 0) return;

        const offsetQubit = (id: string): string => {
          const origIdx = parseInt(id.replace("q", ""), 10);
          const minIdx = Math.min(
            ...wireIds.map((q) => parseInt(q.replace("q", ""), 10))
          );
          const newIdx = qubitIndex + (origIdx - minIdx);
          return `q${Math.max(0, Math.min(circuit.qubits.length - 1, newIdx))}`;
        };

        const pasted: Omit<Operation, "id"> = {
          ...clipboard,
          column,
          targets: clipboard.targets.map(offsetQubit),
          controls: clipboard.controls.map(offsetQubit),
        };
        get().addOperation(pasted);
      },

      alignOperationsLeft: () => {
        set((state) => {
          const circuit = applyLeftAlignment(state.circuit);
          return { circuit, ...pushHistory({ ...state, circuit }) };
        });
      },

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          const circuit = prepareCircuit(history[newIndex].circuit);
          set({
            historyIndex: newIndex,
            circuit,
            validationWarnings: validateCircuitPlacement(circuit),
          });
        }
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          const circuit = prepareCircuit(history[newIndex].circuit);
          set({
            historyIndex: newIndex,
            circuit,
            validationWarnings: validateCircuitPlacement(circuit),
          });
        }
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      getGeneratedCode: () => {
        const result = generateQiskitCode(get().circuit);
        return result.success ? result.code : `# Error: ${result.error}`;
      },

      getValidationWarnings: () => validateCircuitPlacement(get().circuit),

      loadProjects: () => set({ projects: loadProjectsFromStorage() }),

      saveProject: (name) => {
        const { circuit, projects, currentProjectId } = get();
        const now = new Date().toISOString();
        const projectName = name ?? circuit.name;
        const namedCircuit: Circuit = {
          ...structuredClone(circuit),
          name: projectName,
        };

        if (currentProjectId) {
          const existingIdx = projects.findIndex((p) => p.id === currentProjectId);
          if (existingIdx >= 0) {
            const updated = [...projects];
            updated[existingIdx] = {
              ...updated[existingIdx],
              circuit: namedCircuit,
              updatedAt: now,
              name: projectName,
            };
            saveProjectsToStorage(updated);
            set({ projects: updated, circuit: namedCircuit });
            return currentProjectId;
          }
        }

        const project: Project = {
          id: `proj_${Date.now()}`,
          name: projectName,
          circuit: namedCircuit,
          createdAt: now,
          updatedAt: now,
        };
        const updated = [project, ...projects];
        saveProjectsToStorage(updated);
        set({
          projects: updated,
          currentProjectId: project.id,
          circuit: namedCircuit,
        });
        useProgressStore.getState().recordProjectSaved();
        return project.id;
      },

      openProject: (id) => {
        const projects =
          get().projects.length > 0
            ? get().projects
            : loadProjectsFromStorage();
        const project = projects.find((p) => p.id === id);
        if (!project) return null;
        if (get().projects.length === 0) {
          set({ projects });
        }
        get().setCircuit(structuredClone(project.circuit));
        set({ currentProjectId: id });
        return project.circuit;
      },

      renameProject: (id, name) => {
        const projects = get().projects.map((p) =>
          p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
        );
        saveProjectsToStorage(projects);
        set({ projects });
      },

      duplicateProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return;
        const now = new Date().toISOString();
        const duplicate: Project = {
          id: `proj_${Date.now()}`,
          name: `${project.name} (Copy)`,
          circuit: structuredClone(project.circuit),
          createdAt: now,
          updatedAt: now,
        };
        const projects = [duplicate, ...get().projects];
        saveProjectsToStorage(projects);
        set({ projects });
      },

      deleteProject: (id) => {
        const projects = get().projects.filter((p) => p.id !== id);
        saveProjectsToStorage(projects);
        set({
          projects,
          ...(get().currentProjectId === id ? { currentProjectId: null } : {}),
        });
      },
    }),
    {
      name: "qiskit-visualizer-circuit",
      storage: createSafeJsonStorage<
        Pick<CircuitState, "circuit" | "currentProjectId" | "history" | "historyIndex">
      >(),
      merge: (persisted, current) => {
        const saved = persisted as Partial<CircuitState> | undefined;
        if (!saved) return current;

        const circuit = prepareCircuit(saved.circuit ?? current.circuit);
        const history = prepareHistory(
          Array.isArray(saved.history) ? saved.history : current.history
        );
        const historyIndex = asNumber(saved.historyIndex, current.historyIndex);

        return {
          ...current,
          circuit,
          currentProjectId:
            typeof saved.currentProjectId === "string" ? saved.currentProjectId : null,
          history: history.length > 0 ? history : [{ circuit }],
          historyIndex: Math.min(
            Math.max(0, historyIndex),
            Math.max(0, history.length - 1)
          ),
        };
      },
      partialize: (state) => {
        const source = state.buildWorkspace
          ? {
              circuit: state.buildWorkspace.circuit,
              currentProjectId: state.buildWorkspace.currentProjectId,
              history: state.buildWorkspace.history,
              historyIndex: state.buildWorkspace.historyIndex,
            }
          : {
              circuit: state.circuit,
              currentProjectId: state.currentProjectId,
              history: state.history,
              historyIndex: state.historyIndex,
            };
        const { history, historyIndex } = sliceHistoryForPersist(
          source.history,
          source.historyIndex,
          10
        );
        return {
          circuit: source.circuit,
          currentProjectId: source.currentProjectId,
          history,
          historyIndex,
        };
      },
    }
  )
);

export function createOperationFromGateType(
  type: string,
  targets: string[],
  controls: string[],
  column: number,
  classicalTargets: string[] = [],
  parameters?: { value: number; display?: string }[]
): Omit<Operation, "id"> {
  return {
    type,
    label: getGateLabel(type),
    targets,
    controls,
    classicalTargets,
    column,
    parameters,
  };
}
