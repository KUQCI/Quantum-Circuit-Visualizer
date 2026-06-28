"use client";

import { useEffect } from "react";
import { runAppStorageMigrations } from "@/lib/app-storage";
import { prepareCircuit, prepareHistory } from "@/lib/circuit-guard";
import { useCircuitStore } from "@/store/circuit-store";

/**
 * Runs before interactive UI: repairs legacy localStorage and normalizes
 * any circuit already in memory after Zustand rehydration.
 */
export function AppBootstrap() {
  useEffect(() => {
    runAppStorageMigrations();

    const { circuit, history, historyIndex } = useCircuitStore.getState();
    const nextCircuit = prepareCircuit(circuit);
    const nextHistory = prepareHistory(history);
    const nextIndex = Math.min(
      Math.max(0, historyIndex),
      Math.max(0, nextHistory.length - 1)
    );

    const circuitChanged =
      JSON.stringify(nextCircuit) !== JSON.stringify(circuit) ||
      JSON.stringify(nextHistory) !== JSON.stringify(history) ||
      nextIndex !== historyIndex;

    if (circuitChanged) {
      useCircuitStore.setState({
        circuit: nextCircuit,
        history: nextHistory,
        historyIndex: nextIndex,
      });
    }
  }, []);

  return null;
}
