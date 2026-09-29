"use client";

import {
  useCallback,
  useEffect,
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
import { useQuantaBuddyStore } from "@/store/quanta-buddy-store";
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
  const spriteRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<QuantaBuddyEngine | null>(null);
  const lastCallRequest = useRef(callRequest);
  const lastPresent = useRef(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const applyFrame = useCallback((frame: BuddyFrame) => {
    const element = spriteRef.current;
    if (!element) return;
    element.style.transform = `translate(${frame.x}px, ${frame.y}px) scaleX(${frame.scaleX})`;
    element.style.backgroundImage = `url("${buddySpriteUrl(frame.sprite)}")`;
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    engineRef.current?.pointerMove(event.clientX, event.clientY);
  }, []);

  const handlePointerUp = useCallback(() => {
    engineRef.current?.pointerUp();
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
}: {
  contextMenu: ContextMenuState;
  onSit: () => void;
  onWalk: () => void;
  onLeave: () => void;
}) {
  const itemClass = cn(
    "block w-full rounded-md px-3 py-2 text-left transition-colors",
    "hover:bg-[var(--color-muted)]"
  );

  return (
    <div
      className="fixed z-[46] min-w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 text-sm text-[var(--color-foreground)] shadow-lg"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      role="menu"
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" className={itemClass} onClick={onSit}>
        Sit here
      </button>
      <button type="button" className={itemClass} onClick={onWalk}>
        Walk around
      </button>
      <button type="button" className={itemClass} onClick={onLeave}>
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
