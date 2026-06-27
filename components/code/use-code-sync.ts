"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { getCodeLanguage } from "@/lib/code-adapters";
import { validateCircuit } from "@/lib/validation";
import { debounce } from "@/lib/utils";

export function useCodeSync() {
  const { circuit, setCircuit } = useCircuitStore();
  const codePanelLanguage = useEditorUiStore((s) => s.codePanelLanguage);
  const [code, setCode] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "editing" | "error">(
    "synced"
  );
  const syncSourceRef = useRef<"circuit" | "code">("circuit");
  const parseGenerationRef = useRef(0);
  const adapter = getCodeLanguage(codePanelLanguage);

  const syncCodeFromCircuit = useCallback(() => {
    const result = adapter.generate(circuit);
    if (result.success && result.code) {
      setCode(result.code);
      setParseError(null);
      setSyncStatus("synced");
    } else if (!result.success) {
      setParseError(result.error ?? "Generation failed");
      setSyncStatus("error");
    }
  }, [circuit, adapter]);

  const parseCode = useCallback(
    (newCode: string, generation: number) => {
      if (generation !== parseGenerationRef.current) return;

      if (!adapter.bidirectional) {
        setSyncStatus("synced");
        return;
      }

      const result = adapter.parse(newCode, circuit.name);
      if (generation !== parseGenerationRef.current) return;

      if (!result.success || !result.circuit) {
        setParseError(result.error ?? "Parse failed");
        setSyncStatus("error");
        return;
      }
      const validated = validateCircuit(result.circuit);
      if (!validated.valid) {
        setParseError(validated.errors.join("; "));
        setSyncStatus("error");
        return;
      }
      syncSourceRef.current = "code";
      setCircuit(validated.circuit);
      setParseError(null);
      setSyncStatus("synced");
      requestAnimationFrame(() => {
        syncSourceRef.current = "circuit";
      });
    },
    [adapter, circuit.name, setCircuit]
  );

  const debouncedParseRef = useRef<
    ((newCode: string, generation: number) => void) | null
  >(null);

  useEffect(() => {
    debouncedParseRef.current = debounce((newCode: string, generation: number) => {
      parseCode(newCode, generation);
    }, 600);
  }, [parseCode]);

  // Canvas edits → refresh code for the active language
  useEffect(() => {
    if (syncSourceRef.current === "circuit") {
      syncCodeFromCircuit();
    }
  }, [circuit, syncCodeFromCircuit]);

  // Language tab switch → always regenerate from circuit (source of truth)
  useEffect(() => {
    parseGenerationRef.current += 1;
    syncSourceRef.current = "circuit";
    syncCodeFromCircuit();
  }, [codePanelLanguage, syncCodeFromCircuit]);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      syncSourceRef.current = "code";
      setCode(newCode);
      if (!adapter.bidirectional) {
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
    syncSourceRef.current = "circuit";
    syncCodeFromCircuit();
  }, [syncCodeFromCircuit]);

  return {
    code,
    parseError,
    syncStatus,
    adapter,
    handleCodeChange,
    forceSyncFromCircuit,
    readOnly: !adapter.bidirectional,
  };
}
