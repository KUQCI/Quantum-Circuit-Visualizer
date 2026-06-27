"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import {
  getCodeLanguage,
  type CodeLanguageId,
} from "@/lib/code-adapters";
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

  useEffect(() => {
    if (syncSourceRef.current === "circuit") {
      syncCodeFromCircuit();
    }
  }, [circuit, syncCodeFromCircuit, codePanelLanguage]);

  const parseCode = useCallback(
    (newCode: string) => {
      if (!adapter.bidirectional) {
        setSyncStatus("synced");
        return;
      }

      const result = adapter.parse(newCode, circuit.name);
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

  const debouncedParseRef = useRef<((code: string) => void) | null>(null);

  if (!debouncedParseRef.current) {
    debouncedParseRef.current = debounce((newCode: string) => {
      parseCode(newCode);
    }, 600);
  }

  const handleCodeChange = useCallback(
    (newCode: string) => {
      syncSourceRef.current = "code";
      setCode(newCode);
      if (!adapter.bidirectional) {
        setSyncStatus("synced");
        return;
      }
      setSyncStatus("editing");
      setParseError(null);
      debouncedParseRef.current!(newCode);
    },
    [adapter.bidirectional]
  );

  const forceSyncFromCircuit = useCallback(() => {
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
