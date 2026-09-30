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
import { HoverIntent } from "@/lib/quanta-buddy/quick-actions";
import {
  Appetite,
  feedReactionFor,
  stuffedLine,
} from "@/lib/quanta-buddy/feeding";
import {
  pokeReactionFor,
  recoveryLineFor,
  wakeLine,
} from "@/lib/quanta-buddy/persona";
import { playQuack, unlockQuacks } from "@/lib/quanta-buddy/quack";
import { QuantaBuddyBubble } from "@/components/mascot/QuantaBuddyBubble";
import { QuantaBurst } from "@/components/mascot/QuantaBurst";
import { QuantaHatArt } from "@/components/mascot/QuantaHat";
import { QuantaPersona } from "@/components/mascot/QuantaPersona";
import { QuantaQuickActions } from "@/components/mascot/QuantaQuickActions";
import { QuantaWardrobe } from "@/components/mascot/QuantaWardrobe";
import { useQuantaBuddyStore } from "@/store/quanta-buddy-store";
import { useQuantaPopoutStore } from "@/store/quanta-popout-store";
import { useQuantaChatStore } from "@/store/quanta-chat-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { useProgressStore } from "@/store/progress-store";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

interface PointerPress {
  pointerId: number;
  time: number;
  x: number;
  y: number;
  currentX: number;
  currentY: number;
  started: boolean;
  timer: number;
}

interface WardrobeAnchor {
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
  const pointerPress = useRef<PointerPress | null>(null);
  const actionPositioner = useRef<((frame: BuddyFrame) => void) | null>(null);
  const quickActionsOpenRef = useRef(false);
  const hoverIntentRef = useRef(new HoverIntent());
  const pointerOverRing = useRef(false);
  const hoverRequiresLeave = useRef(false);
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
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState<number | null>(null);
  const [wardrobeContext, setWardrobeContext] =
    useState<WardrobeAnchor | null>(null);
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
  const closeQuickActions = useCallback(() => {
    const wasOpen = quickActionsOpenRef.current;
    hoverIntentRef.current.reset();
    if (wasOpen) {
      quickActionsOpenRef.current = false;
      hoverRequiresLeave.current = true;
      engineRef.current?.setFrozen(false);
      setQuickActionsOpen(false);
      setFocusRequest(null);
    }
  }, []);
  const openQuickActions = useCallback((source: "hover" | "click") => {
    if (source === "click") {
      setFocusRequest((request) => (request ?? 0) + 1);
    } else {
      setFocusRequest(null);
    }
    if (!quickActionsOpenRef.current) {
      quickActionsOpenRef.current = true;
      engineRef.current?.setFrozen(true);
      setQuickActionsOpen(true);
    }
  }, []);
  const handleBuddyClick = useCallback(() => {
    if (!quickActionsOpenRef.current) {
      openQuickActions("click");
      return;
    }

    const engine = engineRef.current;
    if (engine?.asleep) {
      say({ text: wakeLine(), variant: "default" });
      quack("soft");
    }
    const pokes = engine?.poke() ?? 0;
    if (pokes === "burst") {
      closeQuickActions();
      quack("pop");
    } else if (pokes > 1) {
      closeQuickActions();
      quack(pokes >= 4 ? "loud" : "soft");
      say({ text: pokeReactionFor(pokes), variant: "error" });
    }
  }, [closeQuickActions, openQuickActions, quack, say]);

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

  const updateHoverIntent = useCallback(
    (frame: BuddyFrame) => {
      const pointer = lastPointer.current;
      const overBuddy =
        frame.present &&
        pointer !== null &&
        pointOnSprite(pointer.x, pointer.y);
      if (!overBuddy) hoverRequiresLeave.current = false;
      const engine = engineRef.current;
      const action = hoverIntentRef.current.update(performance.now(), {
        overBuddy,
        overRing: pointerOverRing.current,
        canOpen:
          clickThrough.current &&
          frame.present &&
          !dragging.current &&
          pointerPress.current === null &&
          !hoverRequiresLeave.current &&
          !!engine &&
          !engine.isBusy,
        open: quickActionsOpenRef.current,
      });
      if (action === "open") {
        openQuickActions("hover");
      } else if (action === "close") {
        const activeElement = document.activeElement;
        const keyboardFocusedButton =
          activeElement instanceof Element &&
          activeElement.matches(":focus-visible") &&
          activeElement.closest('[aria-label="Quanta actions"] button') !==
            null;
        if (!keyboardFocusedButton) closeQuickActions();
      }
    },
    [closeQuickActions, openQuickActions, pointOnSprite]
  );

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
    actionPositioner.current?.(frame);
    if (!frame.present) closeQuickActions();
    updateHoverIntent(frame);
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
  }, [closeQuickActions, updateHitTarget, updateHoverIntent]);

  const beginDrag = useCallback(
    (press: PointerPress, clientX: number, clientY: number) => {
      if (press.started || pointerPress.current !== press) return;
      press.started = true;
      window.clearTimeout(press.timer);
      closeQuickActions();
      dragging.current = true;
      const engine = engineRef.current;
      engine?.pointerDown(press.x, press.y);
      engine?.pointerMove(clientX, clientY);
      updateHitTarget();
    },
    [closeQuickActions, updateHitTarget]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const press = pointerPress.current;
      if (!press || press.pointerId !== event.pointerId) return;
      press.currentX = event.clientX;
      press.currentY = event.clientY;
      if (!press.started) {
        if (Math.hypot(event.clientX - press.x, event.clientY - press.y) >= 5) {
          beginDrag(press, event.clientX, event.clientY);
        }
        return;
      }
      engineRef.current?.pointerMove(event.clientX, event.clientY);
    },
    [beginDrag]
  );

  const finishPointerSession = useCallback(
    (event: PointerEvent | null, allowClick: boolean) => {
      const press = pointerPress.current;
      if (!press || (event && press.pointerId !== event.pointerId)) return;
      const elapsed = performance.now() - press.time;
      if (event) {
        press.currentX = event.clientX;
        press.currentY = event.clientY;
        if (
          !press.started &&
          (Math.hypot(event.clientX - press.x, event.clientY - press.y) >= 5 ||
            elapsed >= 200)
        ) {
          beginDrag(press, event.clientX, event.clientY);
        }
      }

      pointerPress.current = null;
      window.clearTimeout(press.timer);
      dragging.current = false;
      if (press.started) {
        if (event?.type === "pointerup") {
          engineRef.current?.pointerUp(event.clientX, event.clientY);
        } else {
          engineRef.current?.pointerUp();
        }
      } else if (
        allowClick &&
        event?.type === "pointerup" &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) < 5
      ) {
        handleBuddyClick();
      }
      updateHitTarget();
    },
    [beginDrag, handleBuddyClick, updateHitTarget]
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      finishPointerSession(event, event.type === "pointerup");
    },
    [finishPointerSession]
  );

  const handleLostPointerCapture = useCallback(
    (event: PointerEvent) => finishPointerSession(event, false),
    [finishPointerSession]
  );

  const handleWindowBlur = useCallback(
    () => finishPointerSession(null, false),
    [finishPointerSession]
  );

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
      const target = event.target instanceof Element ? event.target : null;
      pointerOverRing.current = !!target?.closest(
        '[aria-label="Quanta actions"] button'
      );
      updateHitTarget();
    };
    const forgetPointer = () => {
      lastPointer.current = null;
      pointerOverRing.current = false;
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
      closeQuickActions();
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
    [closeQuickActions, quack, reducedMotion, say]
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
    const onPointerMove = (event: PointerEvent) => handlePointerMove(event);
    const onPointerUp = (event: PointerEvent) => handlePointerUp(event);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("blur", handleWindowBlur);
      finishPointerSession(null, false);
    };
  }, [
    finishPointerSession,
    handlePointerMove,
    handlePointerUp,
    handleWindowBlur,
  ]);

  useEffect(() => {
    closeQuickActions();
  }, [closeQuickActions, pathname]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || pointerPress.current) return;
      event.preventDefault();
      const press: PointerPress = {
        pointerId: event.pointerId,
        time: performance.now(),
        x: event.clientX,
        y: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        started: false,
        timer: 0,
      };
      pointerPress.current = press;
      event.currentTarget.setPointerCapture(event.pointerId);
      press.timer = window.setTimeout(() => {
        if (pointerPress.current === press) {
          beginDrag(press, press.currentX, press.currentY);
        }
      }, 200);
    },
    [beginDrag]
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      openQuickActions("click");
    },
    [openQuickActions]
  );

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
        onLostPointerCapture={(event) =>
          handleLostPointerCapture(event.nativeEvent)
        }
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
      {!quickActionsOpen && (
        <QuantaBuddyBubble
          bubbleRef={bubbleRef}
          onMeasure={measureBubble}
        />
      )}
      <QuantaPersona engineRef={engineRef} pathname={pathname} />
      {quickActionsOpen && (
        <QuantaQuickActions
          engineRef={engineRef}
          positionerRef={actionPositioner}
          initialFrame={lastFrame.current}
          pathname={pathname}
          reducedMotion={reducedMotion}
          focusRequest={focusRequest}
          sound={sound}
          isSitting={engineRef.current?.isSitting ?? false}
          onClose={closeQuickActions}
          onChat={onChat}
          onSay={say}
          onToggleSound={toggleSound}
          onSetTourCompleted={setTourCompleted}
          onWardrobe={() => {
            const frame = lastFrame.current;
            if (frame) {
              setWardrobeContext({ x: frame.x + 64, y: frame.y });
            }
          }}
        />
      )}
      {wardrobeElement}
    </>
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
