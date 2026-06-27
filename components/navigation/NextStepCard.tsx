import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NextStepCardProps {
  title: string;
  description: string;
  href: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  badge?: string;
  className?: string;
}

export function NextStepCard({
  title,
  description,
  href,
  ctaLabel = "Continue",
  secondaryHref,
  secondaryLabel,
  badge,
  className,
}: NextStepCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] p-4 sm:p-5",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          {badge && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
              {badge}
            </p>
          )}
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">
            {title}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {description}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {secondaryHref && secondaryLabel && (
            <Button asChild variant="outline" size="sm">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          )}
          <Button asChild size="sm" className="gap-1.5">
            <Link href={href}>
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
