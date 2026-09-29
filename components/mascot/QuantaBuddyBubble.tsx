"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { X } from "lucide-react";
import { useTypedText } from "@/lib/use-typed-text";
import { cn } from "@/lib/utils";
import { useQuantaPopoutStore } from "@/store/quanta-popout-store";

export function QuantaBuddyBubble({
  bubbleRef,
  onMeasure,
}: {
  bubbleRef: RefObject<HTMLDivElement | null>;
  onMeasure: (width: number, height: number) => void;
}) {
  const message = useQuantaPopoutStore((state) => state.message);
  const dismiss = useQuantaPopoutStore((state) => state.dismiss);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const remainingRef = useRef(9000);
  const displayedText = useTypedText(message?.text ?? null, reducedMotion);

  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    const { width, height } = bubble.getBoundingClientRect();
    onMeasure(width, height);
  }, [bubbleRef, displayedText, message?.id, onMeasure]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener("change", updateMotion);
    return () => mediaQuery.removeEventListener("change", updateMotion);
  }, []);

  const clearDismissTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleDismiss = useCallback(() => {
    clearDismissTimer();
    if (!message) return;
    startedAtRef.current = Date.now();
    timeoutRef.current = window.setTimeout(dismiss, remainingRef.current);
  }, [clearDismissTimer, dismiss, message]);

  useEffect(() => {
    remainingRef.current = 9000;
    scheduleDismiss();
    return clearDismissTimer;
  }, [clearDismissTimer, message?.id, scheduleDismiss]);

  if (!message) return null;

  const onMouseEnter = () => {
    if (timeoutRef.current === null) return;
    remainingRef.current = Math.max(
      0,
      remainingRef.current - (Date.now() - startedAtRef.current)
    );
    clearDismissTimer();
  };

  return (
    <div
      ref={bubbleRef}
      className={cn(
        "quanta-buddy-bubble fixed z-[44] min-w-0 max-w-[min(360px,calc(100vw-1rem))] rounded-xl border border-[var(--color-border)] border-l-4 bg-[var(--color-card)] p-3 text-sm shadow-2xl",
        message.variant === "success" && "quanta-bubble-success",
        message.variant === "hint" && "quanta-bubble-hint",
        message.variant === "error" && "quanta-bubble-error",
        message.variant === "default" && "quanta-bubble-default"
      )}
      role="status"
      aria-live="polite"
      onMouseEnter={onMouseEnter}
      onMouseLeave={scheduleDismiss}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {message.title && (
            <p className="mb-1 text-xs font-semibold text-[var(--color-foreground)]">
              {message.title}
            </p>
          )}
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {displayedText}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded p-0.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          onClick={dismiss}
          aria-label="Dismiss Quanta"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
