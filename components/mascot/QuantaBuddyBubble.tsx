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
import { variantFromFeedback } from "@/lib/quanta-assets";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { useQuantaPopoutStore } from "@/store/quanta-popout-store";

const MIN_READ_MS = 7000;
const MAX_READ_MS = 20000;
const MS_PER_CHARACTER = 55;

function readingTime(text: string): number {
  return Math.min(
    MAX_READ_MS,
    Math.max(MIN_READ_MS, 2500 + text.length * MS_PER_CHARACTER)
  );
}

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
  const hoveredRef = useRef(false);
  const startedAtRef = useRef(0);
  const remainingRef = useRef(MIN_READ_MS);
  const displayedText = useTypedText(message?.text ?? null, reducedMotion);
  const typing = Boolean(message) && displayedText.length < (message?.text.length ?? 0);

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
    remainingRef.current = readingTime(message?.text ?? "");
    hoveredRef.current = false;
  }, [message?.id, message?.text]);

  useEffect(() => {
    if (typing || hoveredRef.current) {
      clearDismissTimer();
      return;
    }
    scheduleDismiss();
    return clearDismissTimer;
  }, [clearDismissTimer, message?.id, scheduleDismiss, typing]);

  if (!message) return null;

  const onMouseEnter = () => {
    hoveredRef.current = true;
    if (timeoutRef.current === null) return;
    remainingRef.current = Math.max(
      0,
      remainingRef.current - (Date.now() - startedAtRef.current)
    );
    clearDismissTimer();
  };

  const onMouseLeave = () => {
    hoveredRef.current = false;
    if (typing) return;
    scheduleDismiss();
  };

  return (
    <div
      ref={bubbleRef}
      className={cn(
        "quanta-buddy-bubble fixed z-[44] min-w-0 max-w-[min(380px,calc(100vw-1rem))] rounded-2xl border p-3 pl-3.5 text-sm",
        message.variant === "success" && "quanta-bubble-success",
        message.variant === "hint" && "quanta-bubble-hint",
        message.variant === "error" && "quanta-bubble-error",
        message.variant === "default" && "quanta-bubble-default"
      )}
      role="status"
      aria-live="polite"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="quanta-buddy-bubble-tail" aria-hidden="true" />
      <div className="relative flex items-start gap-2.5">
        <QuantaImage
          variant={message.imageVariant ?? variantFromFeedback(message.variant)}
          size={34}
          bare
          className="mt-0.5"
          alt=""
        />
        <div className="min-w-0 flex-1">
          <p className="quanta-buddy-bubble-name">
            {message.title ?? "Quanta"}
          </p>
          <p className="quanta-buddy-bubble-text">
            {displayedText}
            {typing && (
              <span className="quanta-buddy-bubble-caret" aria-hidden="true" />
            )}
          </p>
        </div>
        <button
          type="button"
          className="quanta-buddy-bubble-close shrink-0 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          onClick={dismiss}
          aria-label="Dismiss Quanta"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
