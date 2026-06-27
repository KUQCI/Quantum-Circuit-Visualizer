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
import {
  CODE_LANGUAGES,
  getCodeLanguage,
  type CodeLanguageId,
} from "@/lib/code-adapters";
import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExportPage() {
  const { circuit } = useCircuitStore();
  const [language, setLanguage] = useState<CodeLanguageId>("qiskit");
  const [code, setCode] = useState("");

  const adapter = getCodeLanguage(language);

  useEffect(() => {
    const result = adapter.generate(circuit);
    setCode(
      result.success && result.code
        ? result.code
        : `# Error: ${result.error ?? "Generation failed"}`
    );
  }, [circuit, adapter, language]);

  const summary = getCircuitSummary(circuit);
  const ext = adapter.defaultFilename.split(".").pop() ?? "txt";
  const filename = `${circuit.name.replace(/\s+/g, "_").toLowerCase()}.${ext}`;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Export Circuit</h1>
        <p className="page-description">
          Generate code in Qiskit, OpenQASM, Cirq, IBM Runtime, or JSON from your
          visual circuit
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Circuit Summary</CardTitle>
          <CardDescription>{circuit.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="stat-box">
              <div className="text-2xl font-bold">{summary.qubits}</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">Qubits</div>
            </div>
            <div className="stat-box">
              <div className="text-2xl font-bold">{summary.classicalBits}</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">Classical Bits</div>
            </div>
            <div className="stat-box">
              <div className="text-2xl font-bold">{summary.operations}</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">Operations</div>
            </div>
            <div className="stat-box">
              <div className="text-2xl font-bold">{summary.depth}</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">Depth (columns)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export format</CardTitle>
          <CardDescription>{adapter.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {CODE_LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                className={cn(
                  "segment-btn",
                  language === lang.id && "segment-btn-active"
                )}
                aria-pressed={language === lang.id}
                onClick={() => setLanguage(lang.id)}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <CodeEditor
            value={code}
            readOnly
            language={adapter.monacoLanguage}
            height="360px"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <CodePanelActions code={code} filename={filename} />
            <Button asChild variant="outline">
              <Link href="/editor">
                <PenLine className="h-4 w-4" />
                Open in Editor
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/docs/api">IBM API Reference</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
