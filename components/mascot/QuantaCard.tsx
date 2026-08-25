"use client";

import Link from "next/link";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import type { QuantaVariant } from "@/lib/quanta-assets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuantaCardProps {
  variant?: QuantaVariant;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
  imageSize?: "sm" | "md" | "lg";
}

export function QuantaCard({
  variant = "welcome",
  title,
  description,
  ctaLabel,
  ctaHref,
  className,
  imageSize = "md",
}: QuantaCardProps) {
  return (
    <aside
      className={cn(
        "technical-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5",
        className
      )}
    >
      <QuantaImage variant={variant} size={imageSize} className="mx-auto sm:mx-0" />
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <h3 className="text-base font-semibold text-[var(--color-foreground)]">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {description}
        </p>
        {ctaLabel && ctaHref && (
          <Button asChild size="sm" className="mt-3">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        )}
      </div>
    </aside>
  );
}
