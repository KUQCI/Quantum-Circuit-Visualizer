"use client";

import { useEffect, useRef, useState } from "react";
import { getQuantaAssetUrl } from "@/lib/quanta-assets";
import { useThemeStore } from "@/store/theme-store";

type CursorMode = "off" | "static" | "animated";

const INTERACTIVE_SELECTOR =
  'a,button,[role="button"],label[for],summary,select,[data-quanta-cursor="pointer"]';
const NATIVE_SELECTOR =
  'input,textarea,[contenteditable="true"],.monaco-editor,.composer-resize-handle,[draggable="true"],[data-quanta-cursor="native"]';
const HOTSPOT_X = 30;
const HOTSPOT_Y = 14;
const IDLE_DELAY = 3000;
const SPARKLE_LIFETIME = 520;
const MAX_SPARKLES = 24;

function closestElement(target: EventTarget | null, selector: string): Element | null {
  return target instanceof Element ? target.closest(selector) : null;
}

function isDisabled(element: Element): boolean {
  return element.matches(":disabled,[aria-disabled='true']");
}

function setStyleNumber(element: HTMLElement, name: string, value: number) {
  element.style.setProperty(name, `${value}`);
}

export function QuantaCursorProvider() {
  const enabled = useThemeStore((state) => state.quantaCursor);
  const [mode, setMode] = useState<CursorMode>("off");
  const layerRef = useRef<HTMLDivElement>(null);
  const duckRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!enabled) {
      setMode("off");
      return;
    }

    const pointer = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setMode(!pointer.matches ? "off" : reduced.matches ? "static" : "animated");
    };
    update();
    pointer.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      pointer.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, [enabled]);

  useEffect(() => {
    const root = document.documentElement;
    const defaultUrl = getQuantaAssetUrl("cursorDefault");
    const pointerUrl = getQuantaAssetUrl("cursorPointer");

    root.style.setProperty("--quanta-cursor", `url(${defaultUrl}) 30 14, auto`);
    root.style.setProperty("--quanta-cursor-pointer", `url(${pointerUrl}) 30 10, pointer`);

    if (mode === "static") {
      root.dataset.quantaCursor = "static";
      return () => {
        root.removeAttribute("data-quanta-cursor");
        root.style.removeProperty("--quanta-cursor");
        root.style.removeProperty("--quanta-cursor-pointer");
      };
    }

    if (mode !== "animated") {
      root.removeAttribute("data-quanta-cursor");
      root.style.removeProperty("--quanta-cursor");
      root.style.removeProperty("--quanta-cursor-pointer");
      return;
    }

    // Stay on the native cursor until a real mouse shows up, so the page is
    // never left with no visible cursor at all.
    root.dataset.quantaCursor = "native";
    const duck = duckRef.current;
    const layer = layerRef.current;
    const image = imageRef.current;
    if (!duck || !layer || !image) return;

    const pointerPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const lastPosition = { x: pointerPosition.x, y: pointerPosition.y };
    let rotation = 0;
    let seenPointer = false;
    let lastInteractive: Element | null = null;
    let nativeHidden = true;
    let dragging = false;
    let frame = 0;
    let bounceTimeout: number | undefined;
    let idleTimeout: number | undefined;

    const scheduleIdle = () => {
      if (idleTimeout !== undefined) window.clearTimeout(idleTimeout);
      image.classList.remove("quanta-cursor-idle");
      if (nativeHidden) return;
      idleTimeout = window.setTimeout(() => {
        image.classList.add("quanta-cursor-idle");
      }, IDLE_DELAY);
    };

    const setNativeHidden = (hidden: boolean) => {
      if (hidden === nativeHidden) return;
      nativeHidden = hidden;
      duck.style.opacity = hidden ? "0" : "1";
      root.dataset.quantaCursor = hidden ? "native" : "on";
      if (hidden) {
        image.classList.remove("quanta-cursor-idle", "quanta-cursor-squash");
        if (idleTimeout !== undefined) window.clearTimeout(idleTimeout);
      } else {
        scheduleIdle();
      }
    };

    const setInteractive = (element: Element | null) => {
      if (element === lastInteractive) return;
      lastInteractive = element;
      image.src = element ? pointerUrl : defaultUrl;
      setStyleNumber(image, "--quanta-cursor-scale", element ? 1.15 : 1);
      if (element) {
        image.classList.remove("quanta-cursor-bounce");
        void image.offsetWidth;
        image.classList.add("quanta-cursor-bounce");
        if (bounceTimeout !== undefined) window.clearTimeout(bounceTimeout);
        bounceTimeout = window.setTimeout(() => {
          image.classList.remove("quanta-cursor-bounce");
        }, 260);
      }
    };

    const applyHoverTarget = (element: Element | null) => {
      if (dragging || !element || closestElement(element, NATIVE_SELECTOR)) {
        setNativeHidden(true);
        return;
      }
      setNativeHidden(false);
      const interactive = closestElement(element, INTERACTIVE_SELECTOR);
      setInteractive(interactive && !isDisabled(interactive) ? interactive : null);
    };

    // Hover state can change without the pointer moving (scrolling, layout
    // shifts, drops), so it is re-derived from the last known coordinates.
    const refreshHoverTarget = () => {
      if (!seenPointer) return;
      applyHoverTarget(document.elementFromPoint(pointerPosition.x, pointerPosition.y));
    };

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        seenPointer = false;
        setNativeHidden(true);
        return;
      }
      if (!seenPointer) {
        seenPointer = true;
        lastPosition.x = event.clientX;
        lastPosition.y = event.clientY;
      }
      pointerPosition.x = event.clientX;
      pointerPosition.y = event.clientY;
      scheduleIdle();
      applyHoverTarget(event.target instanceof Element ? event.target : null);
    };

    const spawnSparkles = (x: number, y: number) => {
      const sparkles = Array.from(layer.querySelectorAll(".quanta-cursor-sparkle"));
      sparkles.slice(0, Math.max(0, sparkles.length + 6 - MAX_SPARKLES)).forEach((sparkle) => {
        sparkle.remove();
      });
      for (let index = 0; index < 6; index += 1) {
        const sparkle = document.createElement("span");
        sparkle.className = "quanta-cursor-sparkle";
        sparkle.style.left = `${x}px`;
        sparkle.style.top = `${y}px`;
        sparkle.style.setProperty("--spark-x", `${Math.cos(index * 1.05) * 22}px`);
        sparkle.style.setProperty("--spark-y", `${Math.sin(index * 1.05) * 22}px`);
        sparkle.addEventListener("animationend", () => sparkle.remove(), { once: true });
        // Animations never end while the tab is hidden; drop them regardless.
        window.setTimeout(() => sparkle.remove(), SPARKLE_LIFETIME * 4);
        layer.appendChild(sparkle);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerPosition.x = event.clientX;
      pointerPosition.y = event.clientY;
      applyHoverTarget(event.target instanceof Element ? event.target : null);
      if (nativeHidden) return;
      image.classList.remove("quanta-cursor-squash");
      void image.offsetWidth;
      image.classList.add("quanta-cursor-squash");
      spawnSparkles(event.clientX, event.clientY);
    };

    const handlePointerUp = () => {
      image.classList.remove("quanta-cursor-squash");
      refreshHoverTarget();
    };

    const handleDragStart = () => {
      dragging = true;
      setNativeHidden(true);
    };

    // Drag events are the only position updates during a native HTML5 drag.
    const handleDragOver = (event: DragEvent) => {
      pointerPosition.x = event.clientX;
      pointerPosition.y = event.clientY;
    };

    const handleDragEnd = () => {
      dragging = false;
      refreshHoverTarget();
    };

    const handleLeave = () => {
      seenPointer = false;
      setNativeHidden(true);
    };

    const handleEnter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      handleMove(event);
    };

    const animate = (time: number) => {
      const velocityX = pointerPosition.x - lastPosition.x;
      const velocityY = pointerPosition.y - lastPosition.y;
      lastPosition.x = pointerPosition.x;
      lastPosition.y = pointerPosition.y;
      const speed = Math.hypot(velocityX, velocityY);
      const moving = speed > 0.5;
      const waddle = moving ? Math.sin(time * 0.014) * 6 : 0;
      const bob = moving ? Math.sin(time * 0.014) * 1.5 : 0;
      const targetRotation =
        Math.max(-28, Math.min(28, velocityX * 0.9)) + waddle;
      rotation += (targetRotation - rotation) * 0.3;
      // The duck tracks the pointer exactly: what it points at is what is clicked.
      duck.style.transform = `translate3d(${pointerPosition.x - HOTSPOT_X}px, ${
        pointerPosition.y - HOTSPOT_Y + bob
      }px, 0)`;
      setStyleNumber(image, "--quanta-cursor-rotation", rotation);
      frame = window.requestAnimationFrame(animate);
    };

    document.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("pointerover", handleMove, { passive: true });
    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("pointerenter", handleEnter, { passive: true });
    document.addEventListener("pointerleave", handleLeave);
    document.addEventListener("pointercancel", handleLeave);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("dragover", handleDragOver, { passive: true });
    document.addEventListener("dragend", handleDragEnd);
    document.addEventListener("drop", handleDragEnd);
    document.addEventListener("scroll", refreshHoverTarget, {
      capture: true,
      passive: true,
    });
    window.addEventListener("blur", handleLeave);
    frame = window.requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerover", handleMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointerenter", handleEnter);
      document.removeEventListener("pointerleave", handleLeave);
      document.removeEventListener("pointercancel", handleLeave);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragend", handleDragEnd);
      document.removeEventListener("drop", handleDragEnd);
      document.removeEventListener("scroll", refreshHoverTarget, true);
      window.removeEventListener("blur", handleLeave);
      window.cancelAnimationFrame(frame);
      if (bounceTimeout !== undefined) window.clearTimeout(bounceTimeout);
      if (idleTimeout !== undefined) window.clearTimeout(idleTimeout);
      layer.querySelectorAll(".quanta-cursor-sparkle").forEach((sparkle) => sparkle.remove());
      image.classList.remove(
        "quanta-cursor-idle",
        "quanta-cursor-bounce",
        "quanta-cursor-squash"
      );
      duck.style.transform = "";
      duck.style.opacity = "";
      root.removeAttribute("data-quanta-cursor");
      root.style.removeProperty("--quanta-cursor");
      root.style.removeProperty("--quanta-cursor-pointer");
    };
  }, [mode]);

  if (mode !== "animated") return null;

  return (
    <div
      ref={layerRef}
      data-quanta-cursor-layer
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      <div
        ref={duckRef}
        data-quanta-cursor-duck
        className="absolute left-0 top-0 h-8 w-8 opacity-0"
      >
        <img
          ref={imageRef}
          src={getQuantaAssetUrl("cursorDefault")}
          alt=""
          className="quanta-cursor-duck-img"
          draggable={false}
        />
      </div>
    </div>
  );
}
