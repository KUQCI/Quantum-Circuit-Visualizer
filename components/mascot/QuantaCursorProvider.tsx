"use client";

import { useEffect, useRef, useState } from "react";
import { getQuantaAssetUrl } from "@/lib/quanta-assets";
import { useThemeStore } from "@/store/theme-store";

type CursorMode = "off" | "static" | "animated";

const INTERACTIVE_SELECTOR =
  'a,button,[role="button"],label[for],summary,select,[data-quanta-cursor="pointer"]';
const NATIVE_SELECTOR =
  'input,textarea,[contenteditable="true"],.monaco-editor,.composer-resize-handle,[draggable="true"]';

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

    root.dataset.quantaCursor = "on";
    const duck = duckRef.current;
    const layer = layerRef.current;
    if (!duck || !layer) return;

    const image = imageRef.current;
    if (!image) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const position = { x: target.x, y: target.y };
    const lastTarget = { x: target.x, y: target.y };
    let lastMoveAt = performance.now();
    let lastInteractive: Element | null = null;
    let nativeHidden = false;
    let dragging = false;
    let frame = 0;
    let bounceTimeout: number | undefined;

    const setNativeHidden = (hidden: boolean) => {
      nativeHidden = hidden;
      duck.style.opacity = hidden ? "0" : "1";
      root.dataset.quantaCursor = hidden ? "native" : "on";
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

    const handleMove = (event: MouseEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      lastMoveAt = performance.now();
      image.classList.remove("quanta-cursor-idle");

      const nativeElement = closestElement(event.target, NATIVE_SELECTOR);
      if (dragging || nativeElement) {
        setNativeHidden(true);
        return;
      }
      setNativeHidden(false);
      const interactive = closestElement(event.target, INTERACTIVE_SELECTOR);
      setInteractive(interactive && !isDisabled(interactive) ? interactive : null);
    };

    const handleMouseDown = (event: MouseEvent) => {
      const nativeElement = closestElement(event.target, NATIVE_SELECTOR);
      if (nativeElement) {
        setNativeHidden(true);
        return;
      }
      image.classList.remove("quanta-cursor-squash");
      void image.offsetWidth;
      image.classList.add("quanta-cursor-squash");
      for (let index = 0; index < 6; index += 1) {
        const sparkle = document.createElement("span");
        sparkle.className = "quanta-cursor-sparkle";
        sparkle.style.left = `${event.clientX}px`;
        sparkle.style.top = `${event.clientY}px`;
        sparkle.style.setProperty("--spark-x", `${Math.cos(index * 1.05) * 22}px`);
        sparkle.style.setProperty("--spark-y", `${Math.sin(index * 1.05) * 22}px`);
        sparkle.addEventListener("animationend", () => sparkle.remove(), { once: true });
        layer.appendChild(sparkle);
      }
    };

    const handleMouseUp = () => image.classList.remove("quanta-cursor-squash");
    const handleDragStart = () => {
      dragging = true;
      setNativeHidden(true);
    };
    const handleDragEnd = () => {
      dragging = false;
      setNativeHidden(true);
    };
    const handleLeave = () => setNativeHidden(true);

    const animate = (time: number) => {
      const velocityX = target.x - lastTarget.x;
      const velocityY = target.y - lastTarget.y;
      lastTarget.x = target.x;
      lastTarget.y = target.y;
      position.x += (target.x - position.x) * 0.35;
      position.y += (target.y - position.y) * 0.35;
      const speed = Math.hypot(velocityX, velocityY);
      const moving = speed > 0.5;
      const waddle = moving ? Math.sin(time * 0.014) * 6 : 0;
      const bob = moving ? Math.sin(time * 0.014) * 1.5 : 0;
      const rotation = Math.max(-28, Math.min(28, velocityX * 0.9)) + waddle;
      duck.style.transform = `translate3d(${position.x - 30}px, ${position.y - 14 + bob}px, 0)`;
      setStyleNumber(image, "--quanta-cursor-rotation", rotation);

      if (!nativeHidden && time - lastMoveAt >= 3000) {
        image.classList.add("quanta-cursor-idle");
      }
      frame = window.requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("dragend", handleDragEnd);
    document.addEventListener("mouseleave", handleLeave);
    window.addEventListener("blur", handleLeave);
    frame = window.requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("dragend", handleDragEnd);
      document.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("blur", handleLeave);
      window.cancelAnimationFrame(frame);
      if (bounceTimeout !== undefined) window.clearTimeout(bounceTimeout);
      layer.querySelectorAll(".quanta-cursor-sparkle").forEach((sparkle) => sparkle.remove());
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
        className="absolute left-0 top-0 h-8 w-8"
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
