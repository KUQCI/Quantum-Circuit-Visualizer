"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BackendId } from "@/lib/backends";
import { BACKENDS, getBackend } from "@/lib/backends";
import type { ExecutionResult } from "@/lib/shot-simulator";
import { runCircuitShots } from "@/lib/shot-simulator";
import type { Circuit } from "@/lib/circuit-schema";
import { asNumber, createSafeJsonStorage } from "@/lib/safe-persist";

interface ExecutionState {
  backendId: BackendId;
  shots: number;
  lastResult: ExecutionResult | null;
  isRunning: boolean;
  runError: string | null;

  setBackendId: (id: BackendId) => void;
  setShots: (shots: number) => void;
  runCircuit: (circuit: Circuit) => Promise<ExecutionResult | null>;
  clearResult: () => void;
}

export const useExecutionStore = create<ExecutionState>()(
  persist(
    (set, get) => ({
      backendId: "local-sampler",
      shots: 1024,
      lastResult: null,
      isRunning: false,
      runError: null,

      setBackendId: (id) => {
        const backend = getBackend(id);
        set({
          backendId: id,
          shots: backend.defaultShots || get().shots,
        });
      },

      setShots: (shots) => {
        const backend = getBackend(get().backendId);
        const clamped = Math.max(
          1,
          Math.min(shots, backend.maxShots || 8192)
        );
        set({ shots: clamped });
      },

      runCircuit: async (circuit) => {
        const { backendId, shots } = get();
        const backend = getBackend(backendId);

        if (backend.requiresIbmApi) {
          const err =
            "IBM backends require exporting code and running with your IBM Quantum account.";
          set({ runError: err, isRunning: false });
          return null;
        }

        if (backendId === "local-statevector") {
          set({
            runError: null,
            lastResult: null,
            isRunning: false,
          });
          return null;
        }

        set({ isRunning: true, runError: null });

        // Yield to UI so the running state renders
        await new Promise((r) => setTimeout(r, 0));

        const result = runCircuitShots(circuit, shots, backendId);

        set({
          isRunning: false,
          lastResult: result.error ? null : result,
          runError: result.error,
        });

        return result.error ? null : result;
      },

      clearResult: () => set({ lastResult: null, runError: null }),
    }),
    {
      name: "qiskit-visualizer-execution",
      storage: createSafeJsonStorage<Pick<ExecutionState, "backendId" | "shots">>(),
      merge: (persisted, current) => {
        const saved = persisted as Partial<ExecutionState> | undefined;
        if (!saved) return current;

        const backendId = BACKENDS.some((b) => b.id === saved.backendId)
          ? saved.backendId!
          : current.backendId;

        return {
          ...current,
          backendId,
          shots: asNumber(saved.shots, current.shots),
        };
      },
      partialize: (state) => ({
        backendId: state.backendId,
        shots: state.shots,
      }),
    }
  )
);
