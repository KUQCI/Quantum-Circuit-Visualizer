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
import { PageActions } from "@/components/navigation/PageActions";
import { validateCircuit } from "@/lib/validation";
import {
  CODE_LANGUAGES,
  getCodeLanguage,
  type CodeLanguageId,
} from "@/lib/code-adapters";
import {
  bellStateQiskitCode,
  bellStateOpenQasmCode,
  bellStateCircuit,
} from "@/lib/sample-circuits";
import { AlertCircle, CheckCircle2, PenLine, GraduationCap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Circuit } from "@/lib/circuit-schema";

const EXAMPLES: Record<CodeLanguageId, string> = {
  qiskit: bellStateQiskitCode,
  openqasm: bellStateOpenQasmCode,
  cirq: "",
  "qiskit-runtime": "",
  json: JSON.stringify(bellStateCircuit, null, 2),
};

export default function ImportPage() {
  const router = useRouter();
  const { setCircuit } = useCircuitStore();
  const [language, setLanguage] = useState<CodeLanguageId>("qiskit");
  const [code, setCode] = useState(bellStateQiskitCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    circuit?: Circuit;
    error?: string;
    details?: string[];
  } | null>(null);

  const adapter = getCodeLanguage(language);

  const handleLanguageChange = (lang: CodeLanguageId) => {
    setLanguage(lang);
    setCode(EXAMPLES[lang] || "");
    setResult(null);
  };

  const handleParse = () => {
    setLoading(true);
    setResult(null);

    const parsed = adapter.parse(code);
    if (!parsed.success || !parsed.circuit) {
      setResult({ success: false, error: parsed.error });
      setLoading(false);
      return;
    }

    const validated = validateCircuit(parsed.circuit);
    if (!validated.valid) {
      setResult({
        success: false,
        error: "Parsed circuit failed schema validation",
        details: validated.errors,
      });
      setLoading(false);
      return;
    }

    setResult({ success: true, circuit: validated.circuit });
    setLoading(false);
  };

  const handleOpenInEditor = () => {
    if (result?.success && result.circuit) {
      setCircuit(result.circuit);
      router.push("/editor");
    }
  };

  const circuit = result?.success ? result.circuit : null;
  const importableLanguages = CODE_LANGUAGES.filter((l) => l.bidirectional);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Import Circuit</h1>
        <p className="page-description">
          Paste Qiskit Python, OpenQASM 2.0, or JSON circuit code. Parsed as text
          only — never executed.
        </p>
      </div>

      <PageActions
        className="mb-6"
        secondary={[
          { label: "Build Mode", href: "/editor", icon: <PenLine className="h-4 w-4" /> },
          { label: "Learn Basics", href: "/learn", icon: <GraduationCap className="h-4 w-4" /> },
          { label: "Composer Guide", href: "/docs/composer", icon: <BookOpen className="h-4 w-4" /> },
        ]}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Source format</CardTitle>
          <CardDescription>
            Choose the language of your circuit code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {importableLanguages.map((lang) => (
              <button
                key={lang.id}
                type="button"
                className={cn(
                  "segment-btn",
                  language === lang.id && "segment-btn-active"
                )}
                aria-pressed={language === lang.id}
                onClick={() => handleLanguageChange(lang.id)}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <CodeEditor
            value={code}
            onChange={setCode}
            language={adapter.monacoLanguage}
            height="320px"
          />
          <div className="mt-4 flex gap-3">
            <Button onClick={handleParse} disabled={loading}>
              {loading ? "Parsing..." : `Parse ${adapter.label}`}
            </Button>
            {EXAMPLES[language] && (
              <Button
                variant="outline"
                onClick={() => setCode(EXAMPLES[language])}
              >
                Load Bell State Example
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result && !result.success && (
        <Card className="alert-error mb-6">
          <CardHeader>
            <CardTitle className="alert-error-title flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4" />
              Parse Error
            </CardTitle>
          </CardHeader>
          <CardContent className="alert-error-body text-sm">
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
            <CardTitle className="alert-success-title flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4" />
              Circuit Detected: {circuit.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="stat-box">
                <div className="text-2xl font-bold">{circuit.qubits.length}</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Qubits</div>
              </div>
              <div className="stat-box">
                <div className="text-2xl font-bold">{circuit.classicalBits.length}</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Classical Bits</div>
              </div>
              <div className="stat-box">
                <div className="text-2xl font-bold">{circuit.operations.length}</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Operations</div>
              </div>
              <div className="stat-box">
                <div className="text-2xl font-bold">
                  {circuit.operations.filter((op) => op.type === "measure").length}
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Measurements</div>
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
