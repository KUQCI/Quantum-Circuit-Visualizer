"use client";

import { QuantaImage } from "@/components/mascot/QuantaImage";
import type { QuantaVariant } from "@/lib/quanta-assets";
import { cn } from "@/lib/utils";

interface QuantaTipProps {
  message: string;
  title?: string;
  variant?: QuantaVariant;
  className?: string;
}

/** Compact tip row — Quanta avatar + message. */
export function QuantaTip({
  message,
  title = "Quanta tip",
  variant = "thinking",
  className,
}: QuantaTipProps) {
  return (
    <div
      className={cn(
        "quanta-bubble quanta-bubble-hint flex items-start gap-3 rounded-xl border p-3",
        className
      )}
      role="note"
    >
      <QuantaImage variant={variant} size="xs" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs font-semibold text-[var(--color-foreground)]">
          {title}
        </p>
        <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {message}
        </p>
      </div>
    </div>
  );
}
