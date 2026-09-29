"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePathname } from "next/navigation";
import { normalizePath } from "@/lib/routes";
import { buddySpriteUrl } from "@/lib/quanta-assets";
import {
  QuantaBuddyEngine,
  type BuddyFrame,
} from "@/lib/quanta-buddy/engine";
import { pageHelpFor, tipsFor } from "@/lib/quanta-buddy/persona";
import { requestOpenShortcuts } from "@/lib/shortcuts";
import { QuantaBuddyBubble } from "@/components/mascot/QuantaBuddyBubble";
import { QuantaPersona } from "@/components/mascot/QuantaPersona";
import { useQuantaBuddyStore } from "@/store/quanta-buddy-store";
import { useQuantaPopoutStore } from "@/store/quanta-popout-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";
import { cn } from "@/lib/utils";

const SPRITE_NAMES = [
  "idle_0",
  "hang_0",
  "hang_1",
  "hang_2",
  "hang_3",
  "hang_4",
  "walk_0",
  "walk_1",
  "walk_2",
  "fall_0",
  "fall_1",
  "crawl_0",
  "crawl_1",
  "sit_0",
  "lay_0",
];

interface ContextMenuState {
  x: number;
  y: number;
}

export function QuantaBuddy({
  callRequest,
  reducedMotion,
  autoCall,
}: {
  callRequest: number;
  reducedMotion: boolean;
  autoCall: boolean;
}) {
  const pathname = usePathname();
  const spriteRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleSize = useRef({ width: 0, height: 0 });
  const engineRef = useRef<QuantaBuddyEngine | null>(null);
  const pointerDown = useRef({ time: 0, x: 0, y: 0 });
  const lastCallRequest = useRef(callRequest);
  const lastPresent = useRef(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const message = useQuantaPopoutStore((state) => state.message);
  const setBuddySpeaking = useQuantaPopoutStore(
    (state) => state.setBuddySpeaking
  );
  const setTourCompleted = useEditorUiStore((state) => state.setTourCompleted);
  const say = useQuantaPopoutStore((state) => state.say);
  const measureBubble = useCallback((width: number, height: number) => {
    bubbleSize.current = { width, height };
  }, []);

  const applyFrame = useCallback((frame: BuddyFrame) => {
    const element = spriteRef.current;
    if (element) {
      element.style.transform = `translate(${frame.x}px, ${frame.y}px) scaleX(${frame.scaleX})`;
      element.style.backgroundImage = `url("${buddySpriteUrl(frame.sprite)}")`;
    }

    const bubble = bubbleRef.current;
    const { width, height } = bubbleSize.current;
    if (!bubble || width <= 0 || height <= 0) return;
    const maxX = Math.max(8, window.innerWidth - width - 8);
    const left = Math.min(
      Math.max(8, frame.x + 64 - width / 2),
      maxX
    );
    const maxY = Math.max(8, window.innerHeight - height - 8);
    const preferredTop = frame.y - height - 8;
    const top = Math.min(
      Math.max(8, preferredTop < 8 ? frame.y + 136 : preferredTop),
      maxY
    );
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;

    const spriteCenterX = frame.x + 64;
    const tailX = spriteCenterX - left;
    const below = top > frame.y;
    bubble.dataset.tail =
      tailX < 14 || tailX > width - 14 ? "none" : below ? "top" : "bottom";
    bubble.style.setProperty("--quanta-tail-x", `${tailX}px`);
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    engineRef.current?.pointerMove(event.clientX, event.clientY);
  }, []);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    const elapsed = performance.now() - pointerDown.current.time;
    const distance = Math.hypot(
      event.clientX - pointerDown.current.x,
      event.clientY - pointerDown.current.y
    );
    const isClick =
      event.type !== "pointercancel" && elapsed < 300 && distance < 6;
    if (isClick) {
      engineRef.current?.cancelDrag();
      window.addEventListener(
        "click",
        (clickEvent) => clickEvent.stopPropagation(),
        { capture: true, once: true }
      );
      setContextMenu({ x: event.clientX, y: event.clientY });
    } else {
      engineRef.current?.pointerUp();
    }
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
  }, [handlePointerMove]);

  useEffect(() => {
    const engine = new QuantaBuddyEngine({
      viewport: { width: window.innerWidth, height: window.innerHeight },
      reducedMotion,
    });
    engineRef.current = engine;
    setReady(true);

    return () => {
      engineRef.current = null;
    };
  }, [reducedMotion]);

  useLayoutEffect(() => {
    const measure = () => {
      const bubble = bubbleRef.current;
      if (!bubble) return;
      const rect = bubble.getBoundingClientRect();
      bubbleSize.current = { width: rect.width, height: rect.height };
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [message?.id, visible]);

  useEffect(() => {
    setBuddySpeaking(visible);
    return () => setBuddySpeaking(false);
  }, [setBuddySpeaking, visible]);

  useEffect(() => {
    for (const name of SPRITE_NAMES) {
      const image = new Image();
      image.src = buddySpriteUrl(name);
    }
  }, []);

  useEffect(() => {
    if (!ready || !autoCall) return;
    const timeout = window.setTimeout(() => {
      engineRef.current?.call();
      setVisible(true);
    }, 1500);
    return () => window.clearTimeout(timeout);
  }, [autoCall, ready]);

  useEffect(() => {
    if (!ready || callRequest === lastCallRequest.current) return;
    lastCallRequest.current = callRequest;
    engineRef.current?.call();
    setVisible(true);
  }, [callRequest, ready]);

  useEffect(() => {
    if (!ready) return;
    let frameId = 0;

    const animate = (time: number) => {
      const engine = engineRef.current;
      if (engine) {
        const frame = engine.tick(time);
        applyFrame(frame);
        if (frame.present !== lastPresent.current) {
          lastPresent.current = frame.present;
          setVisible(frame.present);
        }
      }
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [applyFrame, ready]);

  useEffect(() => {
    if (!ready) return;
    const handleResize = () => {
      engineRef.current?.setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [ready]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [contextMenu]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    pointerDown.current = {
      time: performance.now(),
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    engineRef.current?.pointerDown(event.clientX, event.clientY);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }, [handlePointerMove, handlePointerUp]);

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  if (!ready || !visible) {
    return contextMenu ? (
      <BuddyContextMenu
        contextMenu={contextMenu}
        onSit={() => {
          engineRef.current?.sit();
          setContextMenu(null);
        }}
        onWalk={() => {
          engineRef.current?.walkAround();
          setContextMenu(null);
        }}
        onLeave={() => {
          engineRef.current?.leave();
          setContextMenu(null);
        }}
        onHelp={() => {
          say({
            title: "This page",
            text: pageHelpFor(pathname),
            variant: "default",
          });
          setContextMenu(null);
        }}
        onTip={() => {
          const tips = tipsFor(pathname);
          say({
            text: tips[Math.floor(Math.random() * tips.length)] ?? tips[0],
            variant: "hint",
          });
          setContextMenu(null);
        }}
        onShortcuts={() => {
          requestOpenShortcuts();
          setContextMenu(null);
        }}
        onReplayTour={
          normalizePath(pathname) === "/editor"
            ? () => {
                setTourCompleted(false);
                setContextMenu(null);
              }
            : undefined
        }
      />
    ) : null;
  }

  return (
    <>
      <div
        ref={spriteRef}
        role="img"
        aria-label="Quanta buddy"
        draggable={false}
        onPointerDown={handlePointerDown}
        onContextMenu={handleContextMenu}
        className="fixed left-0 top-0 z-[45] h-[128px] w-[128px] cursor-grab select-none bg-center bg-no-repeat active:cursor-grabbing"
        style={{
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      />
      <QuantaBuddyBubble
        bubbleRef={bubbleRef}
        onMeasure={measureBubble}
      />
      <QuantaPersona engineRef={engineRef} pathname={pathname} />
      {contextMenu && (
        <BuddyContextMenu
          contextMenu={contextMenu}
          onSit={() => {
            engineRef.current?.sit();
            setContextMenu(null);
          }}
          onWalk={() => {
            engineRef.current?.walkAround();
            setContextMenu(null);
          }}
          onLeave={() => {
            engineRef.current?.leave();
            setContextMenu(null);
          }}
          onHelp={() => {
            say({
              title: "This page",
              text: pageHelpFor(pathname),
              variant: "default",
            });
            setContextMenu(null);
          }}
          onTip={() => {
            const tips = tipsFor(pathname);
            say({
              text: tips[Math.floor(Math.random() * tips.length)] ?? tips[0],
              variant: "hint",
            });
            setContextMenu(null);
          }}
          onShortcuts={() => {
            requestOpenShortcuts();
            setContextMenu(null);
          }}
          onReplayTour={
            normalizePath(pathname) === "/editor"
              ? () => {
                  setTourCompleted(false);
                  setContextMenu(null);
                }
              : undefined
          }
        />
      )}
    </>
  );
}

function BuddyContextMenu({
  contextMenu,
  onSit,
  onWalk,
  onLeave,
  onHelp,
  onTip,
  onShortcuts,
  onReplayTour,
}: {
  contextMenu: ContextMenuState;
  onSit: () => void;
  onWalk: () => void;
  onLeave: () => void;
  onHelp: () => void;
  onTip: () => void;
  onShortcuts: () => void;
  onReplayTour?: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    sourceX: number;
    sourceY: number;
    x: number;
    y: number;
  } | null>(null);
  const itemClass = cn(
    "block w-full rounded-md px-3 py-2 text-left transition-colors",
    "hover:bg-[var(--color-muted)]"
  );

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const { width, height } = menu.getBoundingClientRect();
    const maxX = Math.max(8, window.innerWidth - width - 8);
    const x = Math.min(Math.max(8, contextMenu.x + 8), maxX);
    const aboveY = contextMenu.y - height - 8;
    const preferredY = aboveY < 0 ? contextMenu.y + 8 : aboveY;
    const maxY = Math.max(8, window.innerHeight - height - 8);
    const y = Math.min(Math.max(8, preferredY), maxY);

    setPosition({
      sourceX: contextMenu.x,
      sourceY: contextMenu.y,
      x,
      y,
    });
  }, [contextMenu]);

  const isMeasured =
    position?.sourceX === contextMenu.x && position.sourceY === contextMenu.y;

  return (
    <div
      ref={menuRef}
      className="fixed z-[46] min-w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 text-sm text-[var(--color-foreground)] shadow-lg"
      style={{
        left: isMeasured ? position.x : 0,
        top: isMeasured ? position.y : 0,
        visibility: isMeasured ? "visible" : "hidden",
      }}
      role="menu"
      onClick={(event) => event.stopPropagation()}
    >
      <p className="px-3 py-2 text-xs font-semibold text-[var(--color-foreground)]">
        Quanta
      </p>
      <button type="button" className={itemClass} onClick={onHelp} role="menuitem">
        What can I do here?
      </button>
      <button type="button" className={itemClass} onClick={onTip} role="menuitem">
        Give me a tip
      </button>
      <button
        type="button"
        className={itemClass}
        onClick={onShortcuts}
        role="menuitem"
      >
        Keyboard shortcuts
      </button>
      {onReplayTour && (
        <button
          type="button"
          className={itemClass}
          onClick={onReplayTour}
          role="menuitem"
        >
          Replay Build tour
        </button>
      )}
      <div className="my-1 border-t border-[var(--color-border)]" />
      <button type="button" className={itemClass} onClick={onSit} role="menuitem">
        Sit here
      </button>
      <button type="button" className={itemClass} onClick={onWalk} role="menuitem">
        Walk around
      </button>
      <button type="button" className={itemClass} onClick={onLeave} role="menuitem">
        Leave
      </button>
    </div>
  );
}

function useDesktopMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

export function QuantaBuddyHost() {
  const pathname = usePathname();
  const enabled = useQuantaBuddyStore((state) => state.enabled);
  const callRequest = useQuantaBuddyStore((state) => state.callRequest);
  const hydrated = usePersistHydrated(useQuantaBuddyStore.persist);
  const desktop = useDesktopMediaQuery("(min-width: 768px)");
  const reducedMotion = useReducedMotion();

  if (!hydrated || !enabled || normalizePath(pathname) === "/embed" || !desktop) {
    return null;
  }

  return (
    <QuantaBuddy
      callRequest={callRequest}
      reducedMotion={reducedMotion}
      autoCall
    />
  );
}
