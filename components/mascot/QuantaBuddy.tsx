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
import { getLevelFromXp } from "@/lib/learning/progress";
import {
  BURST_RESPAWN_DELAY,
  QuantaBuddyEngine,
  SPRITE_NAMES,
  type BuddyBurst,
  type BuddyFrame,
} from "@/lib/quanta-buddy/engine";
import {
  HATS,
  SKINS,
  SKIN_FILTERS,
  hatTransform,
  isUnlocked,
  HAT_HEIGHT,
  HAT_WIDTH,
  type HatId,
  type SkinId,
} from "@/lib/quanta-buddy/wardrobe";
import {
  SPRITE_HIT_SIZE,
  alphaMaskFromRgba,
  isSpritePixelOpaque,
  type SpriteAlphaMask,
} from "@/lib/quanta-buddy/hit-test";
import {
  Appetite,
  feedReactionFor,
  stuffedLine,
} from "@/lib/quanta-buddy/feeding";
import {
  pageHelpFor,
  pokeReactionFor,
  recoveryLineFor,
  tipsFor,
  wakeLine,
} from "@/lib/quanta-buddy/persona";
import { playQuack, unlockQuacks } from "@/lib/quanta-buddy/quack";
import { requestOpenShortcuts } from "@/lib/shortcuts";
import { QuantaBuddyBubble } from "@/components/mascot/QuantaBuddyBubble";
import { QuantaBurst } from "@/components/mascot/QuantaBurst";
import { QuantaHatArt } from "@/components/mascot/QuantaHat";
import { QuantaPersona } from "@/components/mascot/QuantaPersona";
import { QuantaWardrobe } from "@/components/mascot/QuantaWardrobe";
import { useClampedPopupPosition } from "@/components/mascot/useClampedPopupPosition";
import { useQuantaBuddyStore } from "@/store/quanta-buddy-store";
import { useQuantaPopoutStore } from "@/store/quanta-popout-store";
import { useQuantaChatStore } from "@/store/quanta-chat-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { useProgressStore } from "@/store/progress-store";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";
import { cn } from "@/lib/utils";

interface ContextMenuState {
  x: number;
  y: number;
}

interface BurstState extends BuddyBurst {
  id: number;
}

function isGateDrag(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).some(
    (type) => type.toLowerCase() === "gatetype"
  );
}

export function QuantaBuddy({
  callRequest,
  reducedMotion,
  autoCall,
  onChat,
}: {
  callRequest: number;
  reducedMotion: boolean;
  autoCall: boolean;
  onChat: () => void;
}) {
  const pathname = usePathname();
  const spriteRef = useRef<HTMLDivElement>(null);
  const hatRef = useRef<HTMLDivElement>(null);
  const zzzRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleSize = useRef({ width: 0, height: 0 });
  const engineRef = useRef<QuantaBuddyEngine | null>(null);
  const pointerDown = useRef({ time: 0, x: 0, y: 0 });
  const lastCallRequest = useRef(callRequest);
  const lastPresent = useRef(false);
  const spriteMasks = useRef(new Map<string, SpriteAlphaMask>());
  const lastFrame = useRef<BuddyFrame | null>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const feedHover = useRef(false);
  const appetite = useRef(new Appetite());
  const clickThrough = useRef(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [wardrobeContext, setWardrobeContext] =
    useState<ContextMenuState | null>(null);
  const [burst, setBurst] = useState<BurstState | null>(null);
  const clearBurst = useCallback(() => setBurst(null), []);
  const message = useQuantaPopoutStore((state) => state.message);
  const setBuddySpeaking = useQuantaPopoutStore(
    (state) => state.setBuddySpeaking
  );
  const setTourCompleted = useEditorUiStore((state) => state.setTourCompleted);
  const say = useQuantaPopoutStore((state) => state.say);
  const sound = useQuantaBuddyStore((state) => state.sound);
  const storedHat = useQuantaBuddyStore((state) => state.hat);
  const storedSkin = useQuantaBuddyStore((state) => state.skin);
  const toggleSound = useQuantaBuddyStore((state) => state.toggleSound);
  const totalXp = useProgressStore((state) => state.totalXp);
  const level = getLevelFromXp(totalXp);
  const effectiveHat =
    storedHat &&
    HATS.some((item) => item.id === storedHat && isUnlocked(item, level))
      ? storedHat
      : null;
  const effectiveSkin = SKINS.some(
    (item) => item.id === storedSkin && isUnlocked(item, level)
  )
    ? storedSkin
    : "classic";
  const effectiveHatRef = useRef<HatId | null>(effectiveHat);
  const effectiveSkinRef = useRef<SkinId>(effectiveSkin);
  effectiveHatRef.current = effectiveHat;
  effectiveSkinRef.current = effectiveSkin;
  const skinFilter = SKIN_FILTERS[effectiveSkin] || "none";
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const quack = useCallback((kind: "soft" | "loud" | "pop") => {
    if (soundRef.current) playQuack(kind);
  }, []);
  const measureBubble = useCallback((width: number, height: number) => {
    bubbleSize.current = { width, height };
  }, []);

  const pointOnSprite = useCallback((x: number, y: number) => {
    const frame = lastFrame.current;
    if (!frame) return false;
    const mask = spriteMasks.current.get(frame.sprite);
    if (mask) {
      return isSpritePixelOpaque(
        mask,
        frame.x,
        frame.y,
        frame.scaleX,
        x,
        y
      );
    }
    return (
      x >= frame.x &&
      x < frame.x + SPRITE_HIT_SIZE &&
      y >= frame.y &&
      y < frame.y + SPRITE_HIT_SIZE
    );
  }, []);

  // Transparent parts of the sprite box let clicks reach the page underneath.
  const updateHitTarget = useCallback(() => {
    const element = spriteRef.current;
    if (!element || !lastFrame.current) return;
    let hittable =
      feedHover.current || !clickThrough.current || dragging.current;
    if (!hittable) {
      const pointer = lastPointer.current;
      hittable = !!pointer && pointOnSprite(pointer.x, pointer.y);
    }
    const pointerEvents = hittable ? "auto" : "none";
    if (element.style.pointerEvents !== pointerEvents) {
      element.style.pointerEvents = pointerEvents;
    }
    if (feedHover.current) {
      element.dataset.feedHover = "true";
    } else {
      delete element.dataset.feedHover;
    }
  }, [pointOnSprite]);

  const applyFrame = useCallback((frame: BuddyFrame) => {
    const element = spriteRef.current;
    lastFrame.current = frame;
    if (element) {
      element.style.transform = `translate(${frame.x}px, ${frame.y}px) scaleX(${frame.scaleX})`;
      element.style.backgroundImage = `url("${buddySpriteUrl(frame.sprite)}")`;
      const skin = effectiveSkinRef.current;
      if (skin === "classic") {
        element.style.removeProperty("--quanta-skin-filter");
      } else {
        element.style.setProperty(
          "--quanta-skin-filter",
          SKIN_FILTERS[skin]
        );
      }
      updateHitTarget();
    }
    const hat = hatRef.current;
    if (hat) {
      const transform = effectiveHatRef.current
        ? hatTransform(frame.sprite, frame.x, frame.y, frame.scaleX)
        : null;
      if (transform) {
        hat.style.transform = transform;
        hat.style.display = "";
      } else {
        hat.style.display = "none";
      }
    }
    const zzz = zzzRef.current;
    if (zzz) {
      zzz.style.transform = `translate(${frame.x + (frame.scaleX === 1 ? 84 : 20)}px, ${frame.y + 30}px)`;
      zzz.style.display = frame.sleeping ? "" : "none";
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
  }, [updateHitTarget]);

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
    dragging.current = false;
    if (isClick) {
      const engine = engineRef.current;
      engine?.cancelDrag();
      window.addEventListener(
        "click",
        (clickEvent) => clickEvent.stopPropagation(),
        { capture: true, once: true }
      );
      const pokes = engine?.poke() ?? 0;
      if (pokes === "burst") {
        setContextMenu(null);
        quack("pop");
      } else if (pokes > 1) {
        setContextMenu(null);
        quack(pokes >= 4 ? "loud" : "soft");
        say({ text: pokeReactionFor(pokes), variant: "error" });
      } else {
        setContextMenu({ x: event.clientX, y: event.clientY });
      }
    } else {
      engineRef.current?.pointerUp();
    }
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
    updateHitTarget();
  }, [handlePointerMove, quack, say, updateHitTarget]);

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
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context || canvas.width === 0 || canvas.height === 0) return;
        context.drawImage(image, 0, 0);
        try {
          const { data, width, height } = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          spriteMasks.current.set(name, alphaMaskFromRgba(data, width, height));
        } catch {
          // Cross-origin sprites can't be read; fall back to the full box.
        }
      };
      image.src = buddySpriteUrl(name);
    }
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const syncQuery = () => {
      clickThrough.current = query.matches;
      updateHitTarget();
    };
    const trackPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      lastPointer.current = { x: event.clientX, y: event.clientY };
      updateHitTarget();
    };
    const forgetPointer = () => {
      lastPointer.current = null;
      updateHitTarget();
    };
    syncQuery();
    query.addEventListener("change", syncQuery);
    window.addEventListener("pointermove", trackPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", forgetPointer);
    return () => {
      query.removeEventListener("change", syncQuery);
      window.removeEventListener("pointermove", trackPointer);
      document.documentElement.removeEventListener("pointerleave", forgetPointer);
    };
  }, [updateHitTarget]);

  useEffect(() => {
    if (!ready) return;
    const handleDragOver = (event: DragEvent) => {
      const engine = engineRef.current;
      feedHover.current =
        isGateDrag(event) &&
        !!engine?.present &&
        !engine.isBusy &&
        pointOnSprite(event.clientX, event.clientY);
      updateHitTarget();
    };
    const resetFeedHover = () => {
      feedHover.current = false;
      updateHitTarget();
    };
    window.addEventListener("dragover", handleDragOver, true);
    window.addEventListener("drop", resetFeedHover, true);
    window.addEventListener("dragend", resetFeedHover, true);
    return () => {
      window.removeEventListener("dragover", handleDragOver, true);
      window.removeEventListener("drop", resetFeedHover, true);
      window.removeEventListener("dragend", resetFeedHover, true);
    };
  }, [pointOnSprite, ready, updateHitTarget]);

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
        const nextBurst = engine.consumeBurst();
        if (nextBurst) {
          setBurst({ ...nextBurst, id: time });
          if (nextBurst.reason === "thrown") quack("pop");
          const line = recoveryLineFor(nextBurst.reason);
          window.setTimeout(
            () =>
              say({ text: line, variant: "error", imageVariant: "thinking" }),
            BURST_RESPAWN_DELAY + 900
          );
        }
        if (frame.present !== lastPresent.current) {
          lastPresent.current = frame.present;
          setVisible(frame.present);
        }
      }
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [applyFrame, quack, ready, say]);

  useEffect(() => {
    const unlock = () => unlockQuacks();
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Random idle quacks once the visitor has interacted with the page.
  useEffect(() => {
    if (!ready) return;
    let timeout = 0;
    const schedule = () => {
      timeout = window.setTimeout(() => {
        const engine = engineRef.current;
        if (engine?.present && !engine.isBusy && !engine.asleep && soundRef.current) {
          if (playQuack("soft") && !reducedMotion) engine.hop();
        }
        schedule();
      }, 25000 + Math.random() * 50000);
    };
    schedule();
    return () => window.clearTimeout(timeout);
  }, [ready, reducedMotion]);

  const feed = useCallback(
    (gateType: string) => {
      setContextMenu(null);
      const engine = engineRef.current;
      if (engine?.asleep) engine.wake();
      const reaction = feedReactionFor(gateType);
      if (reaction.refuse) {
        say({ text: reaction.text, variant: "hint" });
        quack("soft");
        return;
      }
      if (!appetite.current.eat(performance.now())) {
        say({ text: stuffedLine(), variant: "hint" });
        quack("soft");
        return;
      }
      say({ text: reaction.text, title: "Nom!", variant: "success" });
      quack("soft");
      if (!reducedMotion) engine?.hop();
    },
    [quack, reducedMotion, say]
  );

  useEffect(() => {
    if (!ready) return;
    const lastActivity = { current: performance.now() };
    const recordActivity = (event: Event) => {
      lastActivity.current = performance.now();
      const engine = engineRef.current;
      const target = event.target;
      const onSprite =
        target instanceof Element &&
        target.closest('[aria-label="Quanta buddy"]');
      if (engine?.asleep && !onSprite) engine.wake();
    };
    const activityOptions = { passive: true };
    window.addEventListener("pointerdown", recordActivity, activityOptions);
    window.addEventListener("keydown", recordActivity, activityOptions);
    window.addEventListener("wheel", recordActivity, activityOptions);
    window.addEventListener("pointermove", recordActivity, activityOptions);
    const interval = window.setInterval(() => {
      const engine = engineRef.current;
      if (
        performance.now() - lastActivity.current > 90_000 &&
        engine?.present &&
        !engine.isBusy &&
        !engine.asleep &&
        useQuantaPopoutStore.getState().message === null
      ) {
        engine.sleep();
      }
    }, 5000);
    return () => {
      window.removeEventListener("pointerdown", recordActivity);
      window.removeEventListener("keydown", recordActivity);
      window.removeEventListener("wheel", recordActivity);
      window.removeEventListener("pointermove", recordActivity);
      window.clearInterval(interval);
    };
  }, [engineRef, ready]);

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
    const engine = engineRef.current;
    const wasAsleep = engine?.asleep ?? false;
    if (wasAsleep) {
      say({ text: wakeLine(), variant: "default" });
      quack("soft");
    }
    dragging.current = true;
    pointerDown.current = {
      time: performance.now(),
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    engine?.pointerDown(event.clientX, event.clientY);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }, [handlePointerMove, handlePointerUp, quack, say]);

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  const burstElement = burst ? (
    <QuantaBurst
      key={burst.id}
      x={burst.x}
      y={burst.y}
      reducedMotion={reducedMotion}
      onDone={clearBurst}
      filter={skinFilter}
    />
  ) : null;
  const wardrobeElement = wardrobeContext ? (
    <QuantaWardrobe
      anchor={wardrobeContext}
      level={level}
      onClose={() => setWardrobeContext(null)}
    />
  ) : null;

  if (!ready || !visible) {
    return (
      <>
        {burstElement}
        {contextMenu && (
          <BuddyContextMenu
            contextMenu={contextMenu}
            onWardrobe={() => {
              setWardrobeContext(contextMenu);
              setContextMenu(null);
            }}
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
            onChat={() => {
              onChat();
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
            sound={sound}
            onToggleSound={() => {
              toggleSound();
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
        {wardrobeElement}
      </>
    );
  }

  return (
    <>
      {burstElement}
      <div
        ref={spriteRef}
        role="img"
        aria-label="Quanta buddy"
        draggable={false}
        onPointerDown={handlePointerDown}
        onContextMenu={handleContextMenu}
        onDragOver={(event) => {
          if (!feedHover.current) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const gateType = event.dataTransfer.getData("gateType");
          if (gateType) feed(gateType);
        }}
        className="quanta-buddy-sprite fixed left-0 top-0 z-[45] h-[128px] w-[128px] cursor-grab select-none bg-center bg-no-repeat active:cursor-grabbing"
        style={{
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      />
      {effectiveHat && (
        <div
          ref={hatRef}
          aria-hidden="true"
          data-quanta-hat={effectiveHat}
          className="pointer-events-none fixed left-0 top-0 z-[45]"
          style={{
            width: HAT_WIDTH,
            height: HAT_HEIGHT,
            transformOrigin: "50% 100%",
          }}
        >
          <QuantaHatArt hat={effectiveHat} />
        </div>
      )}
      <span ref={zzzRef} className="quanta-zzz" aria-hidden="true">
        <span>z</span>
        <span>z</span>
        <span>z</span>
      </span>
      <QuantaBuddyBubble
        bubbleRef={bubbleRef}
        onMeasure={measureBubble}
      />
      <QuantaPersona engineRef={engineRef} pathname={pathname} />
      {contextMenu && (
        <BuddyContextMenu
          contextMenu={contextMenu}
          onWardrobe={() => {
            setWardrobeContext(contextMenu);
            setContextMenu(null);
          }}
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
          onChat={() => {
            onChat();
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
          sound={sound}
          onToggleSound={() => {
            toggleSound();
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
      {wardrobeElement}
    </>
  );
}

function BuddyContextMenu({
  contextMenu,
  onWardrobe,
  onSit,
  onWalk,
  onLeave,
  onHelp,
  onChat,
  onTip,
  onShortcuts,
  sound,
  onToggleSound,
  onReplayTour,
}: {
  contextMenu: ContextMenuState;
  onWardrobe: () => void;
  onSit: () => void;
  onWalk: () => void;
  onLeave: () => void;
  onHelp: () => void;
  onChat: () => void;
  onTip: () => void;
  onShortcuts: () => void;
  sound: boolean;
  onToggleSound: () => void;
  onReplayTour?: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { position, isMeasured } = useClampedPopupPosition(
    menuRef,
    contextMenu
  );
  const itemClass = cn(
    "block w-full rounded-md px-3 py-2 text-left transition-colors",
    "hover:bg-[var(--color-muted)]"
  );

  return (
    <div
      ref={menuRef}
      className="fixed z-[46] min-w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 text-sm text-[var(--color-foreground)] shadow-lg"
      style={{
        left: isMeasured ? position?.x : 0,
        top: isMeasured ? position?.y : 0,
        visibility: isMeasured ? "visible" : "hidden",
      }}
      role="menu"
      onClick={(event) => event.stopPropagation()}
    >
      <p className="px-3 py-2 text-xs font-semibold text-[var(--color-foreground)]">
        Quanta
      </p>
      <button type="button" className={itemClass} onClick={onChat} role="menuitem">
        Ask me a question
      </button>
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
      <button
        type="button"
        className={itemClass}
        onClick={onWardrobe}
        role="menuitem"
      >
        Wardrobe
      </button>
      <button
        type="button"
        className={itemClass}
        onClick={onToggleSound}
        role="menuitemcheckbox"
        aria-checked={sound}
      >
        {sound ? "Mute quacks" : "Unmute quacks"}
      </button>
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
  const setChatOpen = useQuantaChatStore((state) => state.setOpen);
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
      onChat={() => setChatOpen(true)}
    />
  );
}
