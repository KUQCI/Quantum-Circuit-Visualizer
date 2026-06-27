"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeEditor } from "@/components/code/code-editor";
import { CodePanelActions } from "@/components/code/code-panel";
import { useCircuitStore } from "@/store/circuit-store";
import { getCircuitSummary } from "@/lib/qiskit-generator";
import { PenLine } from "lucide-react";

export default function ExportPage() {
  const { circuit, getGeneratedCode } = useCircuitStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generate = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/generate-qiskit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ circuit }),
        });
        const data = await res.json();
        if (data.success) {
          setCode(data.code);
        } else {
          setCode(getGeneratedCode());
        }
      } catch {
        setCode(getGeneratedCode());
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, [circuit, getGeneratedCode]);

  const summary = getCircuitSummary(circuit);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Export Circuit</h1>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          Generate Qiskit Python code from the current circuit
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Circuit Summary</CardTitle>
          <CardDescription>{circuit.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-md bg-[var(--color-muted)] p-3 text-center">
              <div className="text-2xl font-bold">{summary.qubits}</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">Qubits</div>
            </div>
            <div className="rounded-md bg-[var(--color-muted)] p-3 text-center">
              <div className="text-2xl font-bold">{summary.classicalBits}</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">Classical Bits</div>
            </div>
            <div className="rounded-md bg-[var(--color-muted)] p-3 text-center">
              <div className="text-2xl font-bold">{summary.operations}</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">Operations</div>
            </div>
            <div className="rounded-md bg-[var(--color-muted)] p-3 text-center">
              <div className="text-2xl font-bold">{summary.depth}</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">Depth (columns)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generated Qiskit Code</CardTitle>
          {loading && (
            <CardDescription>Generating...</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <CodeEditor value={code} readOnly height="360px" />
          <div className="mt-4 flex flex-wrap gap-3">
            <CodePanelActions code={code} filename={`${circuit.name.replace(/\s+/g, "_").toLowerCase()}.py`} />
            <Button asChild variant="outline">
              <Link href="/editor">
                <PenLine className="h-4 w-4" />
                Open in Editor
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
