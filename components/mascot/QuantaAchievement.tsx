"use client";

import { QuantaImage } from "@/components/mascot/QuantaImage";
import { cn } from "@/lib/utils";

interface QuantaAchievementProps {
  title?: string;
  message: string;
  className?: string;
  unlockedCount?: number;
  totalCount?: number;
  layout?: "row" | "column";
}

export function QuantaAchievement({
  title = "Collect badges as you master circuits.",
  message,
  className,
  unlockedCount,
  totalCount,
  layout = "row",
}: QuantaAchievementProps) {
  return (
    <div
      className={cn(
        "technical-panel flex gap-4 p-4 sm:gap-5 sm:p-5",
        layout === "column"
          ? "flex-col items-center text-center"
          : "flex-col sm:flex-row sm:items-center",
        className
      )}
    >
      <QuantaImage
        variant="success"
        size="md"
        className={layout === "column" ? "mx-auto" : "mx-auto sm:mx-0"}
      />
      <div
        className={cn(
          "min-w-0 flex-1",
          layout === "column" ? "text-center" : "text-center sm:text-left"
        )}
      >
        <p className="qci-section-eyebrow mb-1">Achievements</p>
        <h3 className="text-base font-semibold text-[var(--color-foreground)]">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {message}
        </p>
        {unlockedCount !== undefined && totalCount !== undefined && (
          <p className="mt-2 text-xs text-[var(--color-brand)]">
            {unlockedCount} / {totalCount} unlocked
          </p>
        )}
      </div>
    </div>
  );
}
