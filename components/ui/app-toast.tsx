"use client";

import { useEffect, useState } from "react";
import { APP_TOAST_EVENT } from "@/lib/app-toast";

export function AppToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      if (!detail?.message) return;
      setMessage(detail.message);
    };
    window.addEventListener(APP_TOAST_EVENT, onToast);
    return () => window.removeEventListener(APP_TOAST_EVENT, onToast);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!message) return null;
  return (
    <div
      className="fixed top-20 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm font-medium text-[var(--color-foreground)] shadow-lg sm:right-6"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
