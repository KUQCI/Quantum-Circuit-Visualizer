"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MutableRefObject,
  type RefObject,
} from "react";
import {
  Armchair,
  Footprints,
  HelpCircle,
  Keyboard,
  Lightbulb,
  LogOut,
  type LucideIcon,
  Map,
  MessageCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { normalizePath } from "@/lib/routes";
import { pageHelpFor, tipsFor } from "@/lib/quanta-buddy/persona";
import { quickActionPositions } from "@/lib/quanta-buddy/quick-actions";
import type { QuantaBuddyEngine, BuddyFrame } from "@/lib/quanta-buddy/engine";
import type { QuantaPopoutMessage } from "@/store/quanta-popout-store";
import { requestOpenShortcuts } from "@/lib/shortcuts";

type ActionPositioner = (frame: BuddyFrame) => void;
type QuickAction = {
  id: string;
  label: string;
  Icon: LucideIcon;
  onSelect: () => void;
  keepOpen?: boolean;
};

export function QuantaQuickActions({
  engineRef,
  positionerRef,
  initialFrame,
  pathname,
  reducedMotion,
  focusRequest,
  sound,
  isSitting,
  onClose,
  onChat,
  onSay,
  onToggleSound,
  onSetTourCompleted,
}: {
  engineRef: RefObject<QuantaBuddyEngine | null>;
  positionerRef: MutableRefObject<ActionPositioner | null>;
  initialFrame: BuddyFrame | null;
  pathname: string;
  reducedMotion: boolean;
  focusRequest: number | null;
  sound: boolean;
  isSitting: boolean;
  onClose: () => void;
  onChat: () => void;
  onSay: (
    message: Omit<QuantaPopoutMessage, "id" | "updatedAt">
  ) => void;
  onToggleSound: () => void;
  onSetTourCompleted: (completed: boolean) => void;
}) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const route = normalizePath(pathname);

  const actions: QuickAction[] = [
    {
      id: "ask",
      label: "Ask Quanta",
      Icon: MessageCircle,
      onSelect: onChat,
    },
    {
      id: "help",
      label: "What can I do here?",
      Icon: HelpCircle,
      onSelect: () =>
        onSay({
          title: "This page",
          text: pageHelpFor(route),
          variant: "default",
        }),
    },
    {
      id: "tip",
      label: "Give me a tip",
      Icon: Lightbulb,
      onSelect: () => {
        const tips = tipsFor(route);
        onSay({
          text: tips[Math.floor(Math.random() * tips.length)] ?? tips[0],
          variant: "hint",
        });
      },
    },
    {
      id: "shortcuts",
      label: "Keyboard shortcuts",
      Icon: Keyboard,
      onSelect: requestOpenShortcuts,
    },
    ...(route === "/editor"
      ? [
          {
            id: "tour",
            label: "Replay Build tour",
            Icon: Map,
            onSelect: () => onSetTourCompleted(false),
          },
        ]
      : []),
    {
      id: "sound",
      label: sound ? "Mute quacks" : "Unmute quacks",
      Icon: sound ? VolumeX : Volume2,
      onSelect: onToggleSound,
      keepOpen: true,
    },
    {
      id: "sit-walk",
      label: isSitting ? "Walk around" : "Sit here",
      Icon: isSitting ? Footprints : Armchair,
      onSelect: () => {
        if (isSitting) engineRef.current?.walkAround();
        else engineRef.current?.sit();
      },
    },
    {
      id: "hide",
      label: "Hide Quanta",
      Icon: LogOut,
      onSelect: () => engineRef.current?.leave(),
    },
  ];

  useLayoutEffect(() => {
    const position = (frame: BuddyFrame) => {
      const points = quickActionPositions({
        centerX: frame.x + 64,
        centerY: frame.y + 64,
        count: actions.length,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      });
      points.forEach(({ x, y }, index) => {
        const button = buttonRefs.current[index];
        if (!button) return;
        button.style.left = `${x}px`;
        button.style.top = `${y}px`;
        button.style.transform = "scale(1)";
        button.style.opacity = "1";
      });
    };
    positionerRef.current = position;
    let frameId = 0;
    if (initialFrame) {
      frameId = window.requestAnimationFrame(() => position(initialFrame));
    }
    return () => {
      window.cancelAnimationFrame(frameId);
      if (positionerRef.current === position) positionerRef.current = null;
    };
  }, [actions.length, initialFrame, positionerRef]);

  useLayoutEffect(() => {
    if (focusRequest !== null) buttonRefs.current[0]?.focus();
  }, [focusRequest]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (
        target?.closest(
          '[aria-label="Quanta actions"], [aria-label="Quanta buddy"]'
        )
      ) {
        return;
      }
      onClose();
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    const directions: Record<string, number> = {
      ArrowLeft: -1,
      ArrowUp: -1,
      ArrowRight: 1,
      ArrowDown: 1,
    };
    const direction = directions[event.key];
    if (direction === undefined) return;
    event.preventDefault();
    const currentIndex = buttonRefs.current.findIndex(
      (button) => button === document.activeElement
    );
    const nextIndex =
      (currentIndex + direction + actions.length) % actions.length;
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="toolbar"
      aria-label="Quanta actions"
      className="pointer-events-none fixed inset-0 z-[46]"
      onKeyDown={handleKeyDown}
    >
      {actions.map(({ id, label, Icon, onSelect, keepOpen }, index) => (
        <button
          key={id}
          ref={(element) => {
            buttonRefs.current[index] = element;
          }}
          type="button"
          className="pointer-events-auto fixed flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] opacity-0 shadow-lg transition-[opacity,transform] ease-out hover:bg-[var(--color-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          style={{
            left: 0,
            top: 0,
            opacity: reducedMotion ? 1 : 0,
            transform: reducedMotion ? "scale(1)" : "scale(0.55)",
            transitionDuration: reducedMotion ? "0ms" : "180ms",
            transitionDelay: reducedMotion ? "0ms" : `${index * 25}ms`,
          }}
          aria-label={label}
          title={label}
          onClick={() => {
            if (!keepOpen) onClose();
            onSelect();
          }}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
