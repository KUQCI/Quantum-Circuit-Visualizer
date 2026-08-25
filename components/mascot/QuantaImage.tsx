"use client";

import { useState } from "react";
import {
  getQuantaAssetUrl,
  quantaAltText,
  type QuantaVariant,
} from "@/lib/quanta-assets";
import { cn } from "@/lib/utils";

const SIZE_MAP = {
  xs: 40,
  sm: 56,
  md: 96,
  lg: 140,
  xl: 200,
} as const;

export type QuantaImageSize = keyof typeof SIZE_MAP | number;

interface QuantaImageProps {
  variant: QuantaVariant;
  size?: QuantaImageSize;
  className?: string;
  imgClassName?: string;
  alt?: string;
  /** When true, skip the framed card chrome (for tiny inline avatars). */
  bare?: boolean;
  priority?: boolean;
}

export function QuantaImage({
  variant,
  size = "md",
  className,
  imgClassName,
  alt,
  bare = false,
  priority = false,
}: QuantaImageProps) {
  const [failed, setFailed] = useState(false);
  const px = typeof size === "number" ? size : SIZE_MAP[size];
  const src = getQuantaAssetUrl(variant);
  const resolvedAlt = alt ?? quantaAltText[variant];

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-brand)]",
          className
        )}
        style={{ width: px, height: px }}
        role="img"
        aria-label={resolvedAlt}
      >
        Quanta
      </div>
    );
  }

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={resolvedAlt}
      width={px}
      height={px}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-contain", imgClassName)}
      style={{ maxWidth: px, maxHeight: px }}
    />
  );

  if (bare) {
    return (
      <div
        className={cn("relative shrink-0 overflow-hidden", className)}
        style={{ width: px, height: px }}
      >
        {image}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "quanta-image-card relative shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)]",
        "bg-[color-mix(in_srgb,var(--color-surface)_88%,var(--color-cyan-quantum)_6%)] p-1.5",
        "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-cyan-quantum)_20%,transparent),0_0_22px_color-mix(in_srgb,var(--color-gold-duck)_14%,transparent)]",
        className
      )}
      style={{ width: px + 12, height: px + 12 }}
    >
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-transparent">
        {image}
      </div>
    </div>
  );
}
