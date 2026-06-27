"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCircuitStore } from "@/store/circuit-store";
import { generateQiskitCode } from "@/lib/qiskit-generator";
import { parseQiskitCode } from "@/lib/qiskit-parser";
import { validateCircuit } from "@/lib/validation";
import { debounce } from "@/lib/utils";

export function useCodeSync() {
  const { circuit, setCircuit } = useCircuitStore();
  const [code, setCode] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "editing" | "error">(
    "synced"
  );
  const syncSourceRef = useRef<"circuit" | "code">("circuit");

  const syncCodeFromCircuit = useCallback(() => {
    const result = generateQiskitCode(circuit);
    if (result.success) {
      setCode(result.code);
      setParseError(null);
      setSyncStatus("synced");
    }
  }, [circuit]);

  useEffect(() => {
    if (syncSourceRef.current === "circuit") {
      syncCodeFromCircuit();
    }
  }, [circuit, syncCodeFromCircuit]);

  const parseCode = useCallback(
    (newCode: string) => {
      const result = parseQiskitCode(newCode, circuit.name);
      if (!result.success) {
        setParseError(result.error);
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
    [circuit.name, setCircuit]
  );

  const debouncedParseRef = useRef<((code: string) => void) | null>(null);

  if (!debouncedParseRef.current) {
    debouncedParseRef.current = debounce((newCode: string) => {
      parseCode(newCode);
    }, 600);
  }

  const handleCodeChange = useCallback((newCode: string) => {
    syncSourceRef.current = "code";
    setCode(newCode);
    setSyncStatus("editing");
    setParseError(null);
    debouncedParseRef.current!(newCode);
  }, []);

  const forceSyncFromCircuit = useCallback(() => {
    syncSourceRef.current = "circuit";
    syncCodeFromCircuit();
  }, [syncCodeFromCircuit]);

  return {
    code,
    parseError,
    syncStatus,
    handleCodeChange,
    forceSyncFromCircuit,
  };
}
