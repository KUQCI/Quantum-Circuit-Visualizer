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
import { validateCircuitPlacement } from "@/lib/validation";

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

interface CircuitState {
  circuit: Circuit;
  selectedOperationId: string | null;
  validationWarnings: string[];
  history: HistoryEntry[];
  historyIndex: number;

  setCircuit: (circuit: Circuit) => void;
  resetCircuit: () => void;
  setSelectedOperation: (id: string | null) => void;

  addQubit: () => void;
  removeQubit: (qubitId: string) => void;
  addClassicalBit: () => void;
  removeClassicalBit: (bitId: string) => void;

  addOperation: (operation: Omit<Operation, "id">) => void;
  updateOperation: (id: string, updates: Partial<Operation>) => void;
  removeOperation: (id: string) => void;
  moveOperation: (id: string, column: number) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  getGeneratedCode: () => string;
  getValidationWarnings: () => string[];

  projects: Project[];
  loadProjects: () => void;
  saveProject: (name?: string) => void;
  openProject: (id: string) => Circuit | null;
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => void;
  deleteProject: (id: string) => void;
}

const PROJECTS_KEY = "qiskit-visualizer-projects";

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

function loadProjectsFromStorage(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProjectsToStorage(projects: Project[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export const useCircuitStore = create<CircuitState>()(
  persist(
    (set, get) => ({
      circuit: createEmptyCircuit("Untitled Circuit", 2, 0),
      selectedOperationId: null,
      validationWarnings: [],
      history: [{ circuit: createEmptyCircuit("Untitled Circuit", 2, 0) }],
      historyIndex: 0,
      projects: [],

      setCircuit: (circuit) => {
        set((state) => ({
          circuit,
          ...pushHistory({ ...state, circuit }),
        }));
      },

      resetCircuit: () => {
        const circuit = createEmptyCircuit("Untitled Circuit", 2, 0);
        set((state) => ({
          circuit,
          selectedOperationId: null,
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
          const circuit: Circuit = {
            ...state.circuit,
            classicalBits: state.circuit.classicalBits
              .filter((c) => c.id !== bitId)
              .map((c, i) => ({ id: `c${i}`, label: `c[${i}]` })),
            operations: state.circuit.operations.map((op) => ({
              ...op,
              classicalTargets: op.classicalTargets
                .filter((t) => t !== bitId)
                .map((t) => {
                  const origIdx = parseInt(t.replace("c", ""), 10);
                  const newIdx = origIdx > idx ? origIdx - 1 : origIdx;
                  return `c${newIdx}`;
                }),
            })),
          };
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

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          set({
            historyIndex: newIndex,
            circuit: structuredClone(history[newIndex].circuit),
            validationWarnings: validateCircuitPlacement(history[newIndex].circuit),
          });
        }
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          set({
            historyIndex: newIndex,
            circuit: structuredClone(history[newIndex].circuit),
            validationWarnings: validateCircuitPlacement(history[newIndex].circuit),
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
        const { circuit, projects } = get();
        const now = new Date().toISOString();
        const existingIdx = projects.findIndex((p) => p.name === (name ?? circuit.name));

        if (existingIdx >= 0) {
          const updated = [...projects];
          updated[existingIdx] = {
            ...updated[existingIdx],
            circuit: structuredClone(circuit),
            updatedAt: now,
            name: name ?? circuit.name,
          };
          saveProjectsToStorage(updated);
          set({ projects: updated });
        } else {
          const project: Project = {
            id: `proj_${Date.now()}`,
            name: name ?? circuit.name,
            circuit: structuredClone(circuit),
            createdAt: now,
            updatedAt: now,
          };
          const updated = [project, ...projects];
          saveProjectsToStorage(updated);
          set({ projects: updated });
        }
      },

      openProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (project) {
          get().setCircuit(structuredClone(project.circuit));
          return project.circuit;
        }
        return null;
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
        set({ projects });
      },
    }),
    {
      name: "qiskit-visualizer-circuit",
      partialize: (state) => ({
        circuit: state.circuit,
        history: state.history.slice(-10),
        historyIndex: Math.min(state.historyIndex, 9),
      }),
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
