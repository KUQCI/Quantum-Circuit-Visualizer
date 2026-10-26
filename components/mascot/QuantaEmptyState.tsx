"use client";

import Link from "next/link";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import type { QuantaVariant } from "@/lib/quanta-assets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuantaEmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

interface QuantaEmptyStateProps {
  title: string;
  description: string;
  variant?: QuantaVariant;
  actions?: QuantaEmptyStateAction[];
  className?: string;
}

export function QuantaEmptyState({
  title,
  description,
  variant = "empty",
  actions = [],
  className,
}: QuantaEmptyStateProps) {
  return (
    <div
      className={cn(
        "technical-panel flex flex-col items-center gap-3 px-4 py-6 text-center sm:gap-4 sm:px-6 sm:py-10",
        className
      )}
    >
      <QuantaImage
        variant={variant}
        size="lg"
        className="size-[88px]! sm:size-[152px]!"
      />
      <div className="max-w-md">
        <h2 className="text-base font-semibold text-[var(--color-foreground)] sm:text-lg">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {description}
        </p>
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {actions.map((action) => {
            const button = (
              <Button
                key={action.label}
                variant={action.primary ? "default" : "outline"}
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            );
            if (action.href) {
              return (
                <Button
                  key={action.label}
                  asChild
                  variant={action.primary ? "default" : "outline"}
                  size="sm"
                >
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              );
            }
            return button;
          })}
        </div>
      )}
    </div>
  );
}
