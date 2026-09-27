"use client";

import { useEffect, useRef, useState } from "react";
import { useProgressStore } from "@/store/progress-store";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

export function XpToast() {
  const totalXp = useProgressStore((state) => state.totalXp);
  const hydrated = usePersistHydrated(useProgressStore.persist);
  const previous = useRef(totalXp);
  const totalXpRef = useRef(totalXp);
  totalXpRef.current = totalXp;
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    if (hydrated) {
      previous.current = totalXpRef.current;
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const amount = totalXp - previous.current;
    previous.current = totalXp;
    if (amount <= 0) return;
    setDelta(amount);
    const timeout = window.setTimeout(() => setDelta(0), 2400);
    return () => window.clearTimeout(timeout);
  }, [hydrated, totalXp]);

  if (!delta) return null;
  return (
    <div
      className="fixed top-20 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-card)] px-4 py-3 text-sm font-semibold text-[var(--color-brand)] shadow-lg sm:right-6"
      role="status"
      aria-live="polite"
    >
      +{delta} XP · Academy progress
    </div>
  );
}
