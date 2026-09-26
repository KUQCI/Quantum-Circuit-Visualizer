"use client";

import { useEffect, useRef, useState } from "react";
import { useProgressStore } from "@/store/progress-store";

export function XpToast() {
  const totalXp = useProgressStore((state) => state.totalXp);
  const previous = useRef(totalXp);
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    const amount = totalXp - previous.current;
    previous.current = totalXp;
    if (amount <= 0) return;
    setDelta(amount);
    const timeout = window.setTimeout(() => setDelta(0), 2400);
    return () => window.clearTimeout(timeout);
  }, [totalXp]);

  if (!delta) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-card)] px-4 py-3 text-sm font-semibold text-[var(--color-brand)] shadow-lg">
      +{delta} XP · Academy progress
    </div>
  );
}
