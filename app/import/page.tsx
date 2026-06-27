"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeEditor } from "@/components/code/code-editor";
import { useCircuitStore } from "@/store/circuit-store";
import { bellStateQiskitCode } from "@/lib/sample-circuits";
import { AlertCircle, CheckCircle2, PenLine } from "lucide-react";
import type { Circuit } from "@/lib/circuit-schema";

interface ParseResponse {
  success: boolean;
  circuit?: Circuit;
  error?: string;
  details?: string[];
}

export default function ImportPage() {
  const router = useRouter();
  const { setCircuit } = useCircuitStore();
  const [code, setCode] = useState(bellStateQiskitCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResponse | null>(null);

  const handleParse = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/parse-qiskit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data: ParseResponse = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInEditor = () => {
    if (result?.success && result.circuit) {
      setCircuit(result.circuit);
      router.push("/editor");
    }
  };

  const circuit = result?.success ? result.circuit : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Import Qiskit Code</h1>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          Paste Qiskit Python code to parse it into a visual circuit. Code is
          parsed as text only — never executed.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Qiskit Python Code</CardTitle>
          <CardDescription>
            Supports QuantumCircuit declarations and standard gate calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeEditor value={code} onChange={setCode} height="320px" />
          <div className="mt-4 flex gap-3">
            <Button onClick={handleParse} disabled={loading}>
              {loading ? "Parsing..." : "Parse Qiskit"}
            </Button>
            <Button variant="outline" onClick={() => setCode(bellStateQiskitCode)}>
              Load Bell State Example
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && !result.success && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-800">
              <AlertCircle className="h-4 w-4" />
              Parse Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-700">
            <p>{result.error}</p>
            {result.details && (
              <ul className="mt-2 list-inside list-disc">
                {result.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {circuit && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              Circuit Detected: {circuit.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md bg-[var(--color-muted)] p-3 text-center">
                <div className="text-2xl font-bold">{circuit.qubits.length}</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Qubits</div>
              </div>
              <div className="rounded-md bg-[var(--color-muted)] p-3 text-center">
                <div className="text-2xl font-bold">{circuit.classicalBits.length}</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Classical Bits</div>
              </div>
              <div className="rounded-md bg-[var(--color-muted)] p-3 text-center">
                <div className="text-2xl font-bold">{circuit.operations.length}</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Operations</div>
              </div>
              <div className="rounded-md bg-[var(--color-muted)] p-3 text-center">
                <div className="text-2xl font-bold">
                  {circuit.operations.filter((op) => op.type === "measure").length}
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Measurements</div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium">Gate List</h3>
              <div className="flex flex-wrap gap-2">
                {circuit.operations.map((op) => (
                  <span
                    key={op.id}
                    className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1 font-mono text-xs"
                  >
                    {op.label}
                    {op.parameters?.[0]?.display
                      ? `(${op.parameters[0].display})`
                      : ""}
                  </span>
                ))}
              </div>
            </div>

            <Button className="mt-6" onClick={handleOpenInEditor}>
              <PenLine className="h-4 w-4" />
              Open in Editor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
