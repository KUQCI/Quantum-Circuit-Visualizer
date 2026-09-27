"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Share2 } from "lucide-react";
import { CircuitCanvas } from "@/components/circuit/circuit-canvas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProbabilityChart } from "@/components/visualizations/probability-chart";
import { decodeShareParam, encodeCircuitToShare } from "@/lib/share-link";
import { simulateCircuit } from "@/lib/quantum-state";
import { withBasePath } from "@/lib/routes";
import { showAppToast } from "@/lib/app-toast";

export function EmbedCircuit() {
  const params = useSearchParams();
  const circuit = useMemo(
    () => decodeShareParam(params.get("share") ?? ""),
    [params]
  );
  const [shareOpen, setShareOpen] = useState(false);
  const result = useMemo(
    () => (circuit ? simulateCircuit(circuit) : null),
    [circuit]
  );

  if (!circuit || !result) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[var(--color-background)] p-6">
        <section className="max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center shadow-lg">
          <h1 className="text-lg font-semibold">This share link is invalid or too old</h1>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Open a fresh share link from Build to embed a circuit.
          </p>
        </section>
      </main>
    );
  }

  const share = encodeCircuitToShare(circuit);
  const editorHref = withBasePath(`/editor?share=${share}`);
  const embedHref = withBasePath(`/embed?share=${share}`);
  const embedCode = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}${embedHref}" width="100%" height="420" frameborder="0" title="${circuit.name}"></iframe>`;

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      showAppToast("Embed code copied");
    } catch {
      showAppToast("Copy failed — select the code manually");
    }
  };

  return (
    <main className="min-h-dvh bg-[var(--color-background)] p-4 sm:p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
              Shared circuit
            </p>
            <h1 className="text-xl font-semibold">{circuit.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
            <Button asChild size="sm">
              <a href={editorHref}>Open in Build</a>
            </Button>
          </div>
        </header>
        <section className="min-h-[260px] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <CircuitCanvas
            readOnly
            circuitOverride={circuit}
            canvasLabel="Shared circuit canvas"
          />
        </section>
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="mb-2 text-sm font-semibold">Probabilities</h2>
          <div className="h-48">
            <ProbabilityChart
              probabilities={result.probabilities}
              numQubits={result.numQubits}
              error={result.error}
            />
          </div>
        </section>
      </div>
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this circuit</DialogTitle>
            <DialogDescription>
              Copy an iframe snippet to embed this read-only circuit.
            </DialogDescription>
          </DialogHeader>
          <textarea
            readOnly
            value={embedCode}
            className="min-h-24 w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-2 font-mono text-xs"
            aria-label="Embed code"
          />
          <Button onClick={copyEmbedCode}>Copy embed code</Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
