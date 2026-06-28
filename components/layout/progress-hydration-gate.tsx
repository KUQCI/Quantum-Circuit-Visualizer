"use client";

import type { ReactNode } from "react";
import { useProgressStore } from "@/store/progress-store";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

/** Renders children only after progress store has rehydrated from localStorage. */
export function ProgressHydrationGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const hydrated = usePersistHydrated(useProgressStore.persist);

  if (!hydrated) {
    return (
      fallback ?? (
        <div
          className="h-24 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/40"
          aria-hidden
        />
      )
    );
  }

  return children;
}
