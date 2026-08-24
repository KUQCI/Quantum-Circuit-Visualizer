"use client";

import { cn } from "@/lib/utils";

export type ArtistAssetId =
  | "quantum-journey-banner"
  | "intro-video"
  | "quanta-teacher"
  | "custom-gate-icon"
  | "bloch-sphere-duck-icon"
  | "quanta-wave-loop"
  | "gate-opening-animation";

const LABELS: Record<ArtistAssetId, string> = {
  "quantum-journey-banner": "Quantum Journey Banner",
  "intro-video": "Intro Video",
  "quanta-teacher": "Quanta Teacher",
  "custom-gate-icon": "Custom Gate Icon",
  "bloch-sphere-duck-icon": "Bloch Sphere Duck Icon",
  "quanta-wave-loop": "Quanta Waving Loop",
  "gate-opening-animation": "Gate Opening Animation",
};

interface ArtistAssetPlaceholderProps {
  assetId: ArtistAssetId;
  /** Optional override for the visible label */
  label?: string;
  className?: string;
  /** Aspect ratio hint for layout: banner, square, video */
  aspect?: "banner" | "square" | "video" | "icon";
  /**
   * `polished` — public-facing decorative slot (no artist/dev copy).
   * `dev` — internal tracker style with asset IDs (docs/assets only).
   */
  variant?: "polished" | "dev";
  children?: React.ReactNode;
}

/**
 * Slot for future artist assets.
 * Public pages should use variant="polished". Detailed tracking lives on /docs/assets.
 */
export function ArtistAssetPlaceholder({
  assetId,
  label,
  className,
  aspect = "banner",
  variant = "dev",
  children,
}: ArtistAssetPlaceholderProps) {
  const title = label ?? LABELS[assetId];
  const aspectClass =
    aspect === "banner"
      ? "aspect-[21/9] min-h-[140px]"
      : aspect === "video"
        ? "aspect-video min-h-[160px]"
        : aspect === "icon"
          ? "aspect-square min-h-[72px] max-w-[96px]"
          : "aspect-square min-h-[160px]";

  if (variant === "polished") {
    return (
      <div
        data-artist-asset={assetId}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-[var(--color-border)]",
          aspectClass,
          className
        )}
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 28% 20%, rgba(47,128,237,0.28), transparent 55%), radial-gradient(ellipse at 78% 75%, rgba(125,211,252,0.12), transparent 50%), linear-gradient(160deg, #07111f 0%, #0a1628 45%, #050914 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(47,128,237,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(47,128,237,0.12) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {children}
      </div>
    );
  }

  return (
    <div
      data-artist-asset={assetId}
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--color-brand-border)] bg-[var(--color-surface)]/70 text-center",
        aspectClass,
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(47,128,237,0.18), transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(125,211,252,0.1), transparent 50%)",
        }}
        aria-hidden
      />
      {children ?? (
        <>
          <p className="mono-label relative z-[1] px-3 text-[0.65rem] text-[var(--color-brand)]">
            Internal · artist asset
          </p>
          <p className="relative z-[1] mt-2 px-4 text-sm font-semibold text-[var(--color-foreground)]">
            {title}
          </p>
          <p className="relative z-[1] mt-1 max-w-xs px-4 text-xs text-[var(--color-muted-foreground)]">
            Tracked in Docs · Asset Tracker · id: {assetId}
          </p>
        </>
      )}
    </div>
  );
}
