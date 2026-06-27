"use client";

import { QuantaDuck } from "./QuantaDuck";
import { cn } from "@/lib/utils";

interface QuantaMessageProps {
  message: string;
  title?: string;
  variant?: "default" | "success" | "hint" | "error";
  showMascot?: boolean;
  className?: string;
}

export function QuantaMessage({
  message,
  title,
  variant = "default",
  showMascot = true,
  className,
}: QuantaMessageProps) {
  return (
    <div
      className={cn(
        "quanta-bubble flex gap-3 rounded-xl border p-3",
        variant === "success" && "quanta-bubble-success",
        variant === "hint" && "quanta-bubble-hint",
        variant === "error" && "quanta-bubble-error",
        variant === "default" && "quanta-bubble-default",
        className
      )}
      role="status"
    >
      {showMascot && (
        <QuantaDuck size={40} className="shrink-0" animated={variant === "success"} />
      )}
      <div className="min-w-0 flex-1">
        {title && (
          <p className="mb-0.5 text-xs font-semibold text-[var(--color-foreground)]">
            {title}
          </p>
        )}
        <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {message}
        </p>
      </div>
    </div>
  );
}
