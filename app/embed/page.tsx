import { Suspense } from "react";
import { EmbedCircuit } from "@/components/embed/EmbedCircuit";

export default function EmbedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[var(--color-background)] text-sm text-[var(--color-muted-foreground)]">
          Loading circuit…
        </div>
      }
    >
      <EmbedCircuit />
    </Suspense>
  );
}
