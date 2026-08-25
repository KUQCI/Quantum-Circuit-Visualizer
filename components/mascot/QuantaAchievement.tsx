"use client";

import { QuantaImage } from "@/components/mascot/QuantaImage";
import { cn } from "@/lib/utils";

interface QuantaAchievementProps {
  title?: string;
  message: string;
  className?: string;
  unlockedCount?: number;
  totalCount?: number;
}

export function QuantaAchievement({
  title = "Collect badges as you master circuits.",
  message,
  className,
  unlockedCount,
  totalCount,
}: QuantaAchievementProps) {
  return (
    <div
      className={cn(
        "technical-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5",
        className
      )}
    >
      <QuantaImage variant="success" size="md" className="mx-auto sm:mx-0" />
      <div className="min-w-0 flex-1 text-center sm:text-left">
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
