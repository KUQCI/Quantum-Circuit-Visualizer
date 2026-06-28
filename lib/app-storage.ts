import { prepareCircuit, prepareHistory } from "@/lib/circuit-guard";
import { validateCircuit, repairCircuit } from "@/lib/validation";

/** Bump when persisted client data shape or repair rules change. */
export const APP_STORAGE_VERSION = 2;

export const APP_STORAGE_VERSION_KEY = "qiskit-visualizer-storage-version";

export const APP_STORAGE_KEYS = [
  "qiskit-visualizer-circuit",
  "qiskit-visualizer-progress",
  "qiskit-visualizer-theme",
  "qiskit-visualizer-editor-ui",
  "qiskit-visualizer-execution",
  "qiskit-visualizer-projects",
] as const;

function readJson(key: string): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function repairCircuitPersistBlob() {
  const data = readJson("qiskit-visualizer-circuit") as
    | { state?: { circuit?: unknown; history?: { circuit?: unknown }[]; historyIndex?: number } }
    | null;
  if (!data?.state) return;

  const circuit = prepareCircuit(data.state.circuit);
  const history = prepareHistory(
    Array.isArray(data.state.history) ? data.state.history : undefined
  );
  const historyIndex =
    typeof data.state.historyIndex === "number"
      ? Math.min(Math.max(0, data.state.historyIndex), history.length - 1)
      : history.length - 1;

  writeJson("qiskit-visualizer-circuit", {
    ...data,
    state: {
      ...data.state,
      circuit,
      history,
      historyIndex,
    },
  });
}

function repairProjectsBlob() {
  const projects = readJson("qiskit-visualizer-projects");
  if (!Array.isArray(projects)) {
    if (projects !== null) localStorage.removeItem("qiskit-visualizer-projects");
    return;
  }

  const repaired = [];
  for (const item of projects) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.name !== "string") continue;
    const validated = validateCircuit(record.circuit);
    if (!validated.valid) continue;
    repaired.push({
      ...record,
      circuit: repairCircuit(validated.circuit),
    });
  }

  writeJson("qiskit-visualizer-projects", repaired);
}

function repairProgressBlob() {
  const data = readJson("qiskit-visualizer-progress") as
    | { state?: Record<string, unknown> }
    | null;
  if (!data?.state) return;

  const state = data.state;
  const skillXp =
    state.skillXp && typeof state.skillXp === "object"
      ? state.skillXp
      : {
          qubits: 0,
          gates: 0,
          measurement: 0,
          entanglement: 0,
          qiskit: 0,
        };

  writeJson("qiskit-visualizer-progress", {
    ...data,
    state: {
      ...state,
      completedLessons: Array.isArray(state.completedLessons)
        ? state.completedLessons.filter((id): id is string => typeof id === "string")
        : [],
      completedChallenges: Array.isArray(state.completedChallenges)
        ? state.completedChallenges.filter((id): id is string => typeof id === "string")
        : [],
      unlockedAchievements: Array.isArray(state.unlockedAchievements)
        ? state.unlockedAchievements.filter((id): id is string => typeof id === "string")
        : [],
      skillXp,
    },
  });
}

function migrateToV2() {
  repairCircuitPersistBlob();
  repairProjectsBlob();
  repairProgressBlob();
}

const MIGRATIONS: Record<number, () => void> = {
  2: migrateToV2,
};

/**
 * Run idempotent storage repairs before Zustand rehydrates on the client.
 * Safe to call on every page load.
 */
export function runAppStorageMigrations(): void {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(APP_STORAGE_VERSION_KEY);
  const currentVersion = stored ? parseInt(stored, 10) : 0;
  if (Number.isNaN(currentVersion)) {
    localStorage.removeItem(APP_STORAGE_VERSION_KEY);
  }

  const fromVersion = Number.isNaN(currentVersion) ? 0 : currentVersion;
  if (fromVersion >= APP_STORAGE_VERSION) return;

  for (let version = fromVersion + 1; version <= APP_STORAGE_VERSION; version++) {
    MIGRATIONS[version]?.();
  }

  localStorage.setItem(APP_STORAGE_VERSION_KEY, String(APP_STORAGE_VERSION));
}

export function clearAllAppStorage(): void {
  if (typeof window === "undefined") return;
  for (const key of APP_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
  localStorage.removeItem(APP_STORAGE_VERSION_KEY);
}
