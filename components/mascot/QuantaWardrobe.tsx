"use client";

import { useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import {
  HATS,
  SKINS,
  SKIN_FILTERS,
  isUnlocked,
  type HatId,
} from "@/lib/quanta-buddy/wardrobe";
import { getLevelTitle } from "@/lib/learning/progress";
import { buddySpriteUrl } from "@/lib/quanta-assets";
import { QuantaHatArt } from "@/components/mascot/QuantaHat";
import { useClampedPopupPosition } from "@/components/mascot/useClampedPopupPosition";
import { useQuantaBuddyStore } from "@/store/quanta-buddy-store";
import { cn } from "@/lib/utils";

interface WardrobeAnchor {
  x: number;
  y: number;
}

export function QuantaWardrobe({
  anchor,
  level,
  onClose,
}: {
  anchor: WardrobeAnchor;
  level: number;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { position, isMeasured } = useClampedPopupPosition(panelRef, anchor);
  const hat = useQuantaBuddyStore((state) => state.hat);
  const skin = useQuantaBuddyStore((state) => state.skin);
  const setHat = useQuantaBuddyStore((state) => state.setHat);
  const setSkin = useQuantaBuddyStore((state) => state.setSkin);
  const activeHat: HatId | null =
    hat && HATS.some((item) => item.id === hat && isUnlocked(item, level))
      ? hat
      : null;
  const activeSkin =
    SKINS.find((item) => item.id === skin && isUnlocked(item, level))?.id ??
    "classic";

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !panelRef.current?.contains(event.target)
      ) {
        onClose();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const hatButtonClass = (selected: boolean) =>
    cn(
      "flex aspect-square min-w-0 flex-col items-center justify-center gap-1 rounded-md border border-[var(--color-border)] px-1 py-2 text-center transition-colors hover:bg-[var(--color-muted)] disabled:cursor-not-allowed disabled:opacity-50",
      selected && "ring-2 ring-[var(--color-brand)]"
    );

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Quanta's wardrobe"
      className="fixed z-[46] max-h-[calc(100vh-16px)] w-80 max-w-[calc(100vw-16px)] overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-sm text-[var(--color-foreground)] shadow-lg"
      style={{
        left: isMeasured ? position?.x : 0,
        top: isMeasured ? position?.y : 0,
        visibility: isMeasured ? "visible" : "hidden",
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <header className="mb-3">
        <h2 className="text-sm font-semibold">Quanta&apos;s wardrobe</h2>
        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
          Level {level} · {getLevelTitle(level)}
        </p>
      </header>

      <section aria-labelledby="quanta-wardrobe-hats">
        <h3
          id="quanta-wardrobe-hats"
          className="mb-2 text-xs font-semibold uppercase tracking-wide"
        >
          Hats
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            className={hatButtonClass(activeHat === null)}
            aria-pressed={activeHat === null}
            onClick={() => setHat(null)}
          >
            <span aria-hidden="true" className="text-xl leading-none">
              —
            </span>
            <span className="text-xs">None</span>
          </button>
          {HATS.map((item) => {
            const unlocked = isUnlocked(item, level);
            const selected = activeHat === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={hatButtonClass(selected)}
                aria-label={
                  unlocked
                    ? item.name
                    : `${item.name}, unlocks at level ${item.level}`
                }
                aria-pressed={selected}
                disabled={!unlocked}
                title={unlocked ? undefined : `Unlocks at level ${item.level}`}
                onClick={() => setHat(item.id)}
              >
                <QuantaHatArt hat={item.id} size={28} />
                {unlocked ? (
                  <span className="text-xs">{item.name}</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs">
                    <Lock size={12} aria-hidden="true" />
                    Lv {item.level}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="quanta-wardrobe-colors" className="mt-4">
        <h3
          id="quanta-wardrobe-colors"
          className="mb-2 text-xs font-semibold uppercase tracking-wide"
        >
          Colors
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {SKINS.map((item) => {
            const unlocked = isUnlocked(item, level);
            const selected = activeSkin === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={hatButtonClass(selected)}
                aria-label={
                  unlocked
                    ? item.name
                    : `${item.name}, unlocks at level ${item.level}`
                }
                aria-pressed={selected}
                disabled={!unlocked}
                title={unlocked ? undefined : `Unlocks at level ${item.level}`}
                onClick={() => setSkin(item.id)}
              >
                <span
                  aria-hidden="true"
                  className="bg-center bg-no-repeat"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundImage: `url("${buddySpriteUrl("idle_0")}")`,
                    backgroundSize: "40px 40px",
                    filter: SKIN_FILTERS[item.id] || "none",
                  }}
                />
                {unlocked ? (
                  <span className="text-xs">{item.name}</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs">
                    <Lock size={12} aria-hidden="true" />
                    Lv {item.level}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="rounded-md bg-[var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}
