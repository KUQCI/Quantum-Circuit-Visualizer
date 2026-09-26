"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { getCodeLanguage } from "@/lib/code-adapters";
import { validateCircuit } from "@/lib/validation";
import { decideCodeSync } from "@/lib/code-sync-policy";
import type { Circuit } from "@/lib/circuit-schema";
import { debounce } from "@/lib/utils";

export function useCodeSync() {
  const circuit = useCircuitStore((s) => s.circuit);
  const setCircuit = useCircuitStore((s) => s.setCircuit);
  const codePanelLanguage = useEditorUiStore((s) => s.codePanelLanguage);
  const [code, setCode] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pendingCircuit, setPendingCircuit] = useState<Circuit | null>(null);
  const [exportWarnings, setExportWarnings] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<
    "synced" | "editing" | "error" | "blocked" | "partial"
  >("synced");
  const parseGenerationRef = useRef(0);
  /** Skip one circuit→code sync after the circuit was updated by parsing editor text */
  const skipNextCircuitToCodeSyncRef = useRef(false);
  /** While true, never overwrite the editor from the canvas (user is typing or has a parse error) */
  const suppressCircuitToCodeSyncRef = useRef(false);
  const adapter = getCodeLanguage(codePanelLanguage);

  const syncCodeFromCircuit = useCallback(() => {
    const result = adapter.generate(circuit);
    if (result.success && result.code) {
      setCode(result.code);
      setParseError(null);
      const nextExportWarnings = result.warnings ?? [];
      setExportWarnings(nextExportWarnings);
      setSyncStatus(nextExportWarnings.length > 0 ? "partial" : "synced");
    } else if (!result.success) {
      setParseError(result.error ?? "Generation failed");
      setExportWarnings([]);
      setSyncStatus("error");
    }
  }, [circuit, adapter]);

  const parseCode = useCallback(
    (newCode: string, generation: number) => {
      if (generation !== parseGenerationRef.current) return;

      if (!adapter.bidirectional) {
        suppressCircuitToCodeSyncRef.current = false;
        setWarnings([]);
        setPendingCircuit(null);
        setSyncStatus("synced");
        return;
      }

      const result = adapter.parse(newCode, circuit.name);
      if (generation !== parseGenerationRef.current) return;

      if (!result.success || !result.circuit) {
        setParseError(result.error ?? "Parse failed");
        setWarnings(result.warnings ?? []);
        setPendingCircuit(null);
        setExportWarnings([]);
        setSyncStatus("error");
        suppressCircuitToCodeSyncRef.current = true;
        return;
      }

      const decision = decideCodeSync(result, (candidate) => {
        const validated = validateCircuit(candidate);
        return validated.valid
          ? { valid: true, errors: [], circuit: validated.circuit }
          : { ...validated, circuit: candidate };
      });
      if (decision.kind === "error") {
        setParseError(decision.error);
        setWarnings(decision.warnings);
        setPendingCircuit(null);
        setSyncStatus("error");
        suppressCircuitToCodeSyncRef.current = true;
        return;
      }

      setWarnings(decision.warnings);
      setParseError(null);
      if (decision.kind === "blocked") {
        setPendingCircuit(decision.circuit);
        setSyncStatus("blocked");
        suppressCircuitToCodeSyncRef.current = true;
        return;
      }

      skipNextCircuitToCodeSyncRef.current = true;
      suppressCircuitToCodeSyncRef.current = false;
      setPendingCircuit(null);
      setCircuit(decision.circuit);
      setSyncStatus("synced");
    },
    [adapter, circuit.name, setCircuit]
  );

  const debouncedParseRef = useRef<
    (((newCode: string, generation: number) => void) & { cancel: () => void }) | null
  >(null);

  useEffect(() => {
    const debounced = debounce((newCode: string, generation: number) => {
      parseCode(newCode, generation);
    }, 600);
    debouncedParseRef.current = debounced;
    return () => debounced.cancel();
  }, [parseCode]);

  useEffect(() => {
    return () => {
      parseGenerationRef.current += 1;
    };
  }, []);

  // Canvas edits (or language switch via adapter change) → refresh editor text
  useEffect(() => {
    if (skipNextCircuitToCodeSyncRef.current) {
      skipNextCircuitToCodeSyncRef.current = false;
      return;
    }
    if (suppressCircuitToCodeSyncRef.current) {
      return;
    }
    syncCodeFromCircuit();
  }, [circuit, syncCodeFromCircuit]);

  // Cancel in-flight parses when switching language tabs
  useEffect(() => {
    parseGenerationRef.current += 1;
    suppressCircuitToCodeSyncRef.current = false;
    skipNextCircuitToCodeSyncRef.current = false;
    setPendingCircuit(null);
    setWarnings([]);
    syncCodeFromCircuit();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on language tab change
  }, [codePanelLanguage]);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      suppressCircuitToCodeSyncRef.current = true;
      setCode(newCode);
      setPendingCircuit(null);
      setWarnings([]);
      setExportWarnings([]);
      if (!adapter.bidirectional) {
        suppressCircuitToCodeSyncRef.current = false;
        setSyncStatus("synced");
        setParseError(null);
        return;
      }
      setSyncStatus("editing");
      setParseError(null);
      const generation = parseGenerationRef.current;
      debouncedParseRef.current?.(newCode, generation);
    },
    [adapter.bidirectional]
  );

  const forceSyncFromCircuit = useCallback(() => {
    parseGenerationRef.current += 1;
    suppressCircuitToCodeSyncRef.current = false;
    skipNextCircuitToCodeSyncRef.current = false;
    setPendingCircuit(null);
    setWarnings([]);
    syncCodeFromCircuit();
  }, [syncCodeFromCircuit]);

  const applyPending = useCallback(() => {
    if (!pendingCircuit) return;
    skipNextCircuitToCodeSyncRef.current = true;
    suppressCircuitToCodeSyncRef.current = false;
    setCircuit(pendingCircuit);
    setPendingCircuit(null);
    setParseError(null);
    setSyncStatus("synced");
  }, [pendingCircuit, setCircuit]);

  const discardPending = useCallback(() => {
    forceSyncFromCircuit();
  }, [forceSyncFromCircuit]);

  return {
    code,
    parseError,
    warnings,
    pendingCircuit,
    exportWarnings,
    syncStatus,
    adapter,
    handleCodeChange,
    forceSyncFromCircuit,
    applyPending,
    discardPending,
    readOnly: !adapter.bidirectional,
  };
}
