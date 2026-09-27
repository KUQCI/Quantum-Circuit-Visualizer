"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getQuantaAssetUrl } from "@/lib/quanta-assets";

const STORAGE_KEY = "qci-quanta-entrance-v1";
const FADE_MS = 450;
const FADE_LEAD_S = 0.6;
const MAX_WAIT_MS = 2500;

let seenInMemory = false;

function hasSeenEntrance(): boolean {
  if (seenInMemory) return true;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markEntranceSeen(): void {
  seenInMemory = true;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* storage unavailable: in-memory flag still prevents replay */
  }
}

type Phase = "init" | "poster" | "playing" | "fading" | "done";

/**
 * One-time Quanta door-opening entrance shown on the homepage per browser
 * session. The poster stays visible until a real video frame is ready (the
 * clip starts on a black frame), and the whole layer fades out just before
 * the clip ends because the source has no alpha channel.
 */
export function QuantaEntrance() {
  const [phase, setPhase] = useState<Phase>("init");
  const videoRef = useRef<HTMLVideoElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<Element | null>(null);
  const fadeTimeout = useRef<number | null>(null);
  const fadeStarted = useRef(false);

  const finish = useCallback(() => {
    if (fadeStarted.current) return;
    fadeStarted.current = true;
    markEntranceSeen();
    setPhase("fading");
    fadeTimeout.current = window.setTimeout(() => {
      fadeTimeout.current = null;
      setPhase("done");
    }, FADE_MS);
  }, []);

  useEffect(() => {
    if (phase !== "init") return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (hasSeenEntrance() || reduceMotion) {
      markEntranceSeen();
      setPhase("done");
      return;
    }
    setPhase("poster");
  }, [phase]);

  const active = phase !== "init" && phase !== "done";

  useEffect(() => {
    if (!active) return;
    previousFocus.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skipRef.current?.focus();

    const video = videoRef.current;
    const bail = window.setTimeout(finish, MAX_WAIT_MS);
    if (!video) return () => window.clearTimeout(bail);

    const onPlaying = () => {
      window.clearTimeout(bail);
      setPhase("playing");
    };
    const onTime = () => {
      if (
        Number.isFinite(video.duration) &&
        video.duration - video.currentTime <= FADE_LEAD_S
      ) {
        finish();
      }
    };
    video.addEventListener("playing", onPlaying);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ended", finish);
    video.addEventListener("error", finish);
    video.play().catch(finish);

    return () => {
      window.clearTimeout(bail);
      if (fadeTimeout.current !== null) {
        window.clearTimeout(fadeTimeout.current);
        fadeTimeout.current = null;
      }
      document.body.style.overflow = previousOverflow;
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("ended", finish);
      video.removeEventListener("error", finish);
    };
  }, [active, finish]);

  useEffect(() => {
    if (phase !== "done" || !fadeStarted.current) return;
    const prev = previousFocus.current;
    if (prev instanceof HTMLElement && document.contains(prev)) prev.focus();
  }, [phase]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish]);

  if (!active) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quanta welcomes you to the Quantum Circuit Visualizer"
      data-testid="quanta-entrance"
      data-phase={phase}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
      }}
    >
      <img
        src={getQuantaAssetUrl("introPoster")}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover mix-blend-screen"
        style={{ opacity: phase === "poster" ? 1 : 0, transition: "opacity 200ms" }}
      />
      <video
        ref={videoRef}
        src={getQuantaAssetUrl("introVideo")}
        muted
        playsInline
        preload="none"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover mix-blend-screen"
      />
      <button
        ref={skipRef}
        type="button"
        onClick={finish}
        className="quanta-entrance-skip absolute bottom-6 right-6 rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-wider backdrop-blur transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
      >
        Skip intro
      </button>
    </div>
  );
}
