import { createJSONStorage, type StateStorage } from "zustand/middleware";
import { createEmptyCircuit, type Circuit } from "./circuit-schema";
import { validateCircuit, repairCircuit } from "./validation";

function createSafeStateStorage(): StateStorage {
  return {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      try {
        const value = localStorage.getItem(name);
        if (!value) return null;
        JSON.parse(value);
        return value;
      } catch {
        localStorage.removeItem(name);
        return null;
      }
    },
    setItem: (name, value) => {
      localStorage.setItem(name, value);
    },
    removeItem: (name) => {
      localStorage.removeItem(name);
    },
  };
}

/** Drop corrupt localStorage entries instead of crashing the app on parse. */
export function createSafeJsonStorage<T>() {
  return createJSONStorage<T>(() => createSafeStateStorage());
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function sanitizeCircuit(value: unknown): Circuit {
  const result = validateCircuit(value);
  if (result.valid) return repairCircuit(result.circuit);
  return createEmptyCircuit("Untitled circuit", 2, 0);
}
