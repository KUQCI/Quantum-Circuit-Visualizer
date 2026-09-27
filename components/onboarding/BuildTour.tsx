"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { getLayoutTier, type LayoutTier } from "@/lib/composer-layout";
import { getTourSteps } from "@/lib/learning/build-tour";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HighlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface CardPosition {
  left: number;
  top: number;
}

const EMPTY_RECT: HighlightRect = { left: 0, top: 0, width: 0, height: 0 };

function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

export function BuildTour() {
  const tourCompleted = useEditorUiStore((state) => state.tourCompleted);
  const setTourCompleted = useEditorUiStore((state) => state.setTourCompleted);
  const setShowInspector = useEditorUiStore((state) => state.setShowInspector);
  const showInspector = useEditorUiStore((state) => state.showInspector);
  const narrowActiveTab = useEditorUiStore((state) => state.narrowActiveTab);
  const setNarrowActiveTab = useEditorUiStore(
    (state) => state.setNarrowActiveTab
  );
  const hydrated = usePersistHydrated(useEditorUiStore.persist);
  const [layoutTier, setLayoutTier] = useState<LayoutTier>("desktop");
  const [stepIndex, setStepIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [highlight, setHighlight] = useState(EMPTY_RECT);
  const [cardPosition, setCardPosition] = useState<CardPosition | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactLayout, setCompactLayout] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const steps = getTourSteps(layoutTier);
  const step = steps[stepIndex] ?? steps[0];

  useEffect(() => {
    const updateTier = () => {
      setLayoutTier(getLayoutTier(window.innerWidth, window.innerHeight));
      setCompactLayout(window.innerWidth < 768);
    };
    updateTier();
    window.addEventListener("resize", updateTier);
    return () => window.removeEventListener("resize", updateTier);
  }, []);

  useEffect(() => {
    if (!hydrated || tourCompleted) {
      setActive(false);
      return;
    }
    setStepIndex(0);
    setActive(true);
  }, [hydrated, tourCompleted]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener("change", updateMotion);
    return () => mediaQuery.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    if (!active || !step) return;
    if (step.narrowTab) {
      setNarrowActiveTab(step.narrowTab);
    }
    if (step.id === "inspector" && layoutTier === "desktop") {
      setShowInspector(true);
    }
    if (step.id === "gates" && layoutTier === "desktop") {
      setShowInspector(false);
    }
  }, [
    active,
    layoutTier,
    setNarrowActiveTab,
    setShowInspector,
    step,
  ]);

  const updateHighlight = useCallback(() => {
    if (!active || !step) return;
    const target =
      layoutTier !== "desktop" && step.narrowTab
        ? document.querySelector<HTMLElement>(
            `[data-narrow-tab="${step.narrowTab}"]`
          )
        : document.querySelector<HTMLElement>(`[data-tour="${step.id}"]`);
    if (!target) {
      setHighlight(EMPTY_RECT);
      return;
    }
    const rect = target.getBoundingClientRect();
    setHighlight({
      left: Math.max(0, rect.left - 6),
      top: Math.max(0, rect.top - 6),
      width: rect.width + 12,
      height: rect.height + 12,
    });
  }, [active, layoutTier, step]);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const refresh = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateHighlight);
    };
    refresh();
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    };
  }, [active, narrowActiveTab, showInspector, updateHighlight]);

  useEffect(() => {
    if (!active || compactLayout || !cardRef.current || highlight.width === 0) {
      setCardPosition(null);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) return;

      const { width, height } = card.getBoundingClientRect();
      const margin = 16;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const candidates = [
        {
          left: highlight.left + highlight.width + margin,
          top: highlight.top,
          fits:
            highlight.left + highlight.width + margin + width <=
            viewportWidth - margin,
        },
        {
          left: highlight.left - margin - width,
          top: highlight.top,
          fits: highlight.left - margin - width >= margin,
        },
        {
          left: highlight.left,
          top: highlight.top + highlight.height + margin,
          fits:
            highlight.top + highlight.height + margin + height <=
            viewportHeight - margin,
        },
        {
          left: highlight.left,
          top: highlight.top - margin - height,
          fits: highlight.top - margin - height >= margin,
        },
      ];
      const preferred = candidates.find((candidate) => candidate.fits) ?? candidates[2];
      setCardPosition({
        left: Math.min(
          viewportWidth - margin - width,
          Math.max(margin, preferred.left)
        ),
        top: Math.min(
          viewportHeight - margin - height,
          Math.max(margin, preferred.top)
        ),
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [active, compactLayout, highlight, stepIndex]);

  useEffect(() => {
    if (!active || !cardRef.current) return;
    const focusables = focusableElements(cardRef.current);
    focusables[0]?.focus();
  }, [active, stepIndex]);

  const finish = useCallback(() => {
    setActive(false);
    setTourCompleted(true);
  }, [setTourCompleted]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      finish();
      return;
    }
    if (event.key !== "Tab" || !cardRef.current) return;
    const focusables = focusableElements(cardRef.current);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!active || !step || highlight.width === 0) return null;

  const panelStyle: CSSProperties = {
    left: highlight.left,
    top: highlight.top,
    width: highlight.width,
    height: highlight.height,
    transition: reducedMotion ? "none" : "all 180ms ease-out",
  };

  return (
    <div className="fixed inset-0 z-[60]" onKeyDown={handleKeyDown}>
      <div
        className="absolute inset-x-0 top-0 bg-[var(--color-tour-backdrop)]"
        style={{ height: highlight.top }}
        aria-hidden
      />
      <div
        className="absolute left-0 bg-[var(--color-tour-backdrop)]"
        style={{
          top: highlight.top,
          width: highlight.left,
          height: highlight.height,
        }}
        aria-hidden
      />
      <div
        className="absolute right-0 bg-[var(--color-tour-backdrop)]"
        style={{
          top: highlight.top,
          left: highlight.left + highlight.width,
          height: highlight.height,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 bg-[var(--color-tour-backdrop)]"
        style={{ top: highlight.top + highlight.height }}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute rounded-xl border-2 border-[var(--color-brand)] shadow-[0_0_0_9999px_rgba(0,0,0,0.02),0_0_24px_color-mix(in_srgb,var(--color-brand)_55%,transparent)]",
          !reducedMotion && "transition-[left,top,width,height] duration-200 ease-out"
        )}
        style={panelStyle}
        aria-hidden
      />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="build-tour-title"
        aria-describedby="build-tour-body"
        className={cn(
          "technical-panel absolute mx-auto max-w-md border-[var(--color-brand-border)] bg-[var(--color-surface)] shadow-2xl",
          compactLayout
            ? "bottom-4 left-4 right-4 p-4"
            : "p-5"
        )}
        style={
          compactLayout
            ? { backgroundColor: "var(--color-surface)" }
            : {
                left: cardPosition?.left,
                top: cardPosition?.top,
                backgroundColor: "var(--color-surface)",
              }
        }
      >
        <div className="flex items-start gap-3">
          <div className="hidden shrink-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-2xl sm:block">
            <QuantaImage variant="learning" size="sm" bare />
          </div>
          <div className="min-w-0 flex-1">
            <p className="qci-section-eyebrow">Build tour · {stepIndex + 1} of {steps.length}</p>
            <h2
              id="build-tour-title"
              className="mt-1 text-base font-semibold text-[var(--color-foreground)]"
            >
              {step.title}
            </h2>
            <p
              id="build-tour-body"
              className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]"
            >
              {step.body}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div
            className="flex shrink-0 items-center gap-1.5"
            role="group"
            aria-label="Tour progress"
          >
            {steps.map((item, index) => (
              <span
                key={item.id}
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  index === stepIndex
                    ? "bg-[var(--color-brand)]"
                    : "bg-[var(--color-muted-foreground)]/60"
                )}
                aria-hidden
              />
            ))}
          </div>
          <button
            type="button"
            className="text-xs text-[var(--color-muted-foreground)] underline-offset-2 hover:text-[var(--color-foreground)] hover:underline"
            onClick={finish}
          >
            Skip tour
          </button>
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
              disabled={stepIndex === 0}
            >
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (stepIndex === steps.length - 1) finish();
                else setStepIndex((index) => index + 1);
              }}
            >
              {stepIndex === steps.length - 1 ? "Start building" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
