"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { X } from "lucide-react";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { variantFromFeedback } from "@/lib/quanta-assets";
import { cn } from "@/lib/utils";
import { useQuantaPopoutStore } from "@/store/quanta-popout-store";
import { useTypedText } from "@/lib/use-typed-text";

export function QuantaPopout({ bottomOffset }: { bottomOffset?: number }) {
  const message = useQuantaPopoutStore((state) => state.message);
  const buddySpeaking = useQuantaPopoutStore((state) => state.buddySpeaking);
  const dismiss = useQuantaPopoutStore((state) => state.dismiss);
  const [reducedMotion, setReducedMotion] = useState(false);
  const displayedText = useTypedText(message?.text ?? null, reducedMotion);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener("change", updateMotion);
    return () => mediaQuery.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(dismiss, 9000);
    return () => window.clearTimeout(timeout);
  }, [dismiss, message]);

  if (!message || buddySpeaking) return null;

  const imageVariant =
    message.imageVariant ?? variantFromFeedback(message.variant);

  return (
    <div
      key={message.id}
      className="quanta-popout fixed bottom-20 right-4 z-40 flex max-w-[calc(100vw-2rem)] items-end gap-2 max-[639px]:bottom-[var(--quanta-popout-bottom)] sm:bottom-6 sm:max-w-xs"
      style={
        {
          "--quanta-popout-bottom": `${bottomOffset ?? 112}px`,
        } as CSSProperties
      }
      role="status"
      aria-live="polite"
    >
      <QuantaImage
        variant={imageVariant}
        size="md"
        className="quanta-popout-image quanta-bob hidden rounded-xl border-[var(--color-border)] bg-[var(--color-card)] p-1.5 shadow-2xl sm:block"
      />
      <QuantaImage
        variant={imageVariant}
        size="sm"
        className="quanta-popout-image quanta-bob rounded-xl border-[var(--color-border)] bg-[var(--color-card)] p-1.5 shadow-2xl sm:hidden"
      />
      <div
        className={cn(
          "quanta-popout-bubble quanta-bubble min-w-0 flex-1 rounded-xl border border-[var(--color-border)] border-l-4 bg-[var(--color-card)] p-3 text-sm shadow-2xl",
          message.variant === "success" && "quanta-bubble-success",
          message.variant === "hint" && "quanta-bubble-hint",
          message.variant === "error" && "quanta-bubble-error",
          message.variant === "default" && "quanta-bubble-default"
        )}
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
    </div>
  );
}
