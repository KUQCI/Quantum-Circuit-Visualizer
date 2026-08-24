"use client";

import { useMemo, useState } from "react";
import { useCircuitStore } from "@/store/circuit-store";
import { generateQiskitCode } from "@/lib/qiskit-generator";
import { parseQiskitCode } from "@/lib/qiskit-parser";
import { validateCircuitSemantics } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { PageActions } from "@/components/navigation/PageActions";
import { PenLine, BookOpen } from "lucide-react";

/**
 * Developer debug view for the client-side translator pipeline.
 * Shows live JSON IR, validation, parser warnings, and generated Qiskit.
 */
export default function TranslatorDebugPage() {
  const circuit = useCircuitStore((s) => s.circuit);
  const [scratch, setScratch] = useState(
    `from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure([0, 1], [0, 1])\n`
  );
  const [parseLog, setParseLog] = useState<string>("");

  const generated = useMemo(() => generateQiskitCode(circuit), [circuit]);
  const semantics = useMemo(() => validateCircuitSemantics(circuit), [circuit]);

  const runParse = () => {
    const result = parseQiskitCode(scratch, "Debug Parse");
    if (!result.success) {
      setParseLog(`ERROR: ${result.error}\nWarnings:\n${(result.warnings ?? []).join("\n")}`);
      return;
    }
    setParseLog(
      `OK — ${result.circuit.operations.length} ops\nWarnings:\n${result.warnings.join("\n") || "(none)"}\n\nIR:\n${JSON.stringify(result.circuit, null, 2)}`
    );
  };

  return (
    <div className="page-container max-w-5xl">
      <div className="page-header mb-6">
        <p className="qci-section-eyebrow">Docs · Developer</p>
        <h1 className="page-title text-3xl">Translator debug</h1>
        <p className="page-description mt-2 max-w-2xl">
          Inspect the live Circuit IR (Zustand store), semantic validation, and
          Qiskit generate/parse path. Client-side only — no server execution.
        </p>
        <PageActions
          className="mt-4"
          primary={[
            { label: "Open Build", href: "/editor", icon: <PenLine className="h-4 w-4" /> },
          ]}
          secondary={[
            {
              label: "Translator audit",
              href: "/docs/composer",
              icon: <BookOpen className="h-4 w-4" />,
            },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="technical-panel p-4">
          <h2 className="mono-label mb-3 text-xs text-[var(--color-brand)]">
            Live JSON IR
          </h2>
          <pre className="max-h-[360px] overflow-auto rounded-xl bg-[var(--color-canvas)] p-3 text-xs text-[var(--color-foreground)]">
            {JSON.stringify(circuit, null, 2)}
          </pre>
        </section>

        <section className="technical-panel p-4">
          <h2 className="mono-label mb-3 text-xs text-[var(--color-brand)]">
            Validation
          </h2>
          <p className="mb-2 text-sm">
            Status:{" "}
            <span
              className={
                semantics.isValid
                  ? "text-[var(--color-success)]"
                  : "text-[var(--color-destructive)]"
              }
            >
              {semantics.isValid ? "valid" : "invalid"}
            </span>
          </p>
          <pre className="max-h-[160px] overflow-auto rounded-xl bg-[var(--color-canvas)] p-3 text-xs">
            Errors:{"\n"}
            {semantics.errors.join("\n") || "(none)"}
            {"\n\n"}Warnings:{"\n"}
            {semantics.warnings.join("\n") || "(none)"}
          </pre>
          <h2 className="mono-label mb-2 mt-4 text-xs text-[var(--color-brand)]">
            Generated Qiskit
          </h2>
          <pre className="max-h-[160px] overflow-auto rounded-xl bg-[var(--color-canvas)] p-3 text-xs">
            {generated.success
              ? generated.code
              : `ERROR: ${generated.error}`}
            {generated.success && generated.warnings.length
              ? `\n# warnings:\n# ${generated.warnings.join("\n# ")}`
              : ""}
          </pre>
        </section>
      </div>

      <section className="technical-panel mt-4 p-4">
        <h2 className="mono-label mb-3 text-xs text-[var(--color-brand)]">
          Scratch Qiskit parse
        </h2>
        <textarea
          value={scratch}
          onChange={(e) => setScratch(e.target.value)}
          className="min-h-[160px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-3 font-mono text-xs text-[var(--color-foreground)]"
          spellCheck={false}
        />
        <Button className="mt-3" size="sm" onClick={runParse}>
          Parse scratchpad
        </Button>
        <pre className="mt-3 max-h-[320px] overflow-auto rounded-xl bg-[var(--color-canvas)] p-3 text-xs">
          {parseLog || "Results appear here."}
        </pre>
      </section>
    </div>
  );
}
