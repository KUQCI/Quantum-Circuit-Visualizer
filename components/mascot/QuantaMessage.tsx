"use client";

import { QuantaImage } from "./QuantaImage";
import { variantFromFeedback, type QuantaVariant } from "@/lib/quanta-assets";
import { cn } from "@/lib/utils";

interface QuantaMessageProps {
  message: string;
  title?: string;
  variant?: "default" | "success" | "hint" | "error";
  /** Override image variant independently of bubble style */
  imageVariant?: QuantaVariant;
  showMascot?: boolean;
  className?: string;
  size?: "default" | "lg";
}

export function QuantaMessage({
  message,
  title,
  variant = "default",
  imageVariant,
  showMascot = true,
  className,
  size = "default",
}: QuantaMessageProps) {
  const isLg = size === "lg";
  const img =
    imageVariant ??
    variantFromFeedback(
      variant === "default" ? "default" : variant
    );

  return (
    <div
      className={cn(
        "quanta-bubble flex gap-3 rounded-xl border",
        isLg ? "p-4" : "p-3",
        variant === "success" && "quanta-bubble-success",
        variant === "hint" && "quanta-bubble-hint",
        variant === "error" && "quanta-bubble-error",
        variant === "default" && "quanta-bubble-default",
        className
      )}
      role="status"
    >
      {showMascot && (
        <QuantaImage
          variant={img}
          size={isLg ? "sm" : "xs"}
          className="shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        {title && (
          <p
            className={cn(
              "mb-1 font-semibold text-[var(--color-foreground)]",
              isLg ? "text-sm" : "text-xs"
            )}
          >
            {title}
          </p>
        )}
        <p
          className={cn(
            "leading-relaxed text-[var(--color-muted-foreground)]",
            isLg ? "text-base" : "text-sm"
          )}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
