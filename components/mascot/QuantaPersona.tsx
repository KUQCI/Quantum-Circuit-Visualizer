"use client";

import { useEffect, useRef, type RefObject } from "react";
import { isFullWorkspacePath, normalizePath } from "@/lib/routes";
import { unboundSymbols } from "@/lib/parameter-bindings";
import {
  getLevelFromXp,
  getLevelTitle,
  xpForNextLevel,
} from "@/lib/learning/progress";
import {
  greetingFor,
  randomDuckQuip,
  runErrorReaction,
  runReactionFor,
  tipsFor,
} from "@/lib/quanta-buddy/persona";
import {
  HATS,
  SKINS,
  newlyUnlocked,
} from "@/lib/quanta-buddy/wardrobe";
import type { QuantaBuddyEngine } from "@/lib/quanta-buddy/engine";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";
import { useCircuitStore } from "@/store/circuit-store";
import { useProgressStore } from "@/store/progress-store";
import { useQuantaPopoutStore } from "@/store/quanta-popout-store";
import { useExecutionStore } from "@/store/execution-store";
import { useQuantaBuddyStore } from "@/store/quanta-buddy-store";

export function QuantaPersona({
  engineRef,
  pathname,
}: {
  engineRef: RefObject<QuantaBuddyEngine | null>;
  pathname: string;
}) {
  const path = normalizePath(pathname);
  const totalXp = useProgressStore((state) => state.totalXp);
  const levelTitle = getLevelTitle(getLevelFromXp(totalXp));
  const streak = useProgressStore((state) => state.currentStreak);
  const completedLessons = useProgressStore(
    (state) => state.completedLessons.length
  );
  const progressHydrated = usePersistHydrated(useProgressStore.persist);
  const say = useQuantaPopoutStore((state) => state.say);
  const validationWarnings = useCircuitStore(
    (state) => state.validationWarnings
  );
  const circuit = useCircuitStore((state) => state.circuit);
  const lastResult = useExecutionStore((state) => state.lastResult);
  const runError = useExecutionStore((state) => state.runError);
  const greetedPaths = useRef(new Set<string>());
  const tipCountByPath = useRef(new Map<string, number>());
  const usedTipsByPath = useRef(new Map<string, Set<string>>());
  const previousXp = useRef(totalXp);
  const totalXpRef = useRef(totalXp);
  totalXpRef.current = totalXp;
  const previousLevel = useRef(getLevelFromXp(totalXp));
  const previousWarningCount = useRef(validationWarnings.length);
  const previousUnbound = useRef<string[]>([]);
  const previousResult = useRef(lastResult);
  const previousRunError = useRef(runError);
  const lastFollowAt = useRef(0);

  useEffect(() => {
    if (!progressHydrated) return;
    previousXp.current = totalXpRef.current;
    previousLevel.current = getLevelFromXp(totalXpRef.current);
  }, [progressHydrated]);

  useEffect(() => {
    const engine = engineRef.current;
    if (engine?.present && !engine.isBusy) {
      engine.walkTo(window.innerWidth / 2);
    }
  }, [engineRef, path]);

  useEffect(() => {
    if (!progressHydrated || greetedPaths.current.has(path)) return;

    const timeout = window.setTimeout(() => {
      const engine = engineRef.current;
      if (
        !engine?.present ||
        useQuantaPopoutStore.getState().message
      ) {
        return;
      }

      const greeting = greetingFor({
        path,
        level: getLevelFromXp(totalXp),
        levelTitle,
        streak,
        completedLessons,
        xpToNext: xpForNextLevel(totalXp).xpNeeded,
        firstVisit: completedLessons === 0 && totalXp === 0,
      });
      if (!greeting) {
        greetedPaths.current.add(path);
        return;
      }
      say({ ...greeting, variant: "default" });
      greetedPaths.current.add(path);
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [
    completedLessons,
    engineRef,
    levelTitle,
    path,
    progressHydrated,
    say,
    streak,
    totalXp,
  ]);

  useEffect(() => {
    let timeout: number | null = null;

    const schedule = () => {
      timeout = window.setTimeout(() => {
        const engine = engineRef.current;
        const used = usedTipsByPath.current.get(path) ?? new Set<string>();
        const count = tipCountByPath.current.get(path) ?? 0;
        const tips = tipsFor(path).filter((tip) => !used.has(tip));
        if (
          engine?.present &&
          !engine.isBusy &&
          !useQuantaPopoutStore.getState().message &&
          count < 3 &&
          tips.length > 0
        ) {
          const tip = tips[Math.floor(Math.random() * tips.length)] ?? tips[0];
          used.add(tip);
          usedTipsByPath.current.set(path, used);
          tipCountByPath.current.set(path, count + 1);
          say({ text: tip, variant: "hint" });
        } else if (
          engine?.present &&
          !engine.isBusy &&
          !useQuantaPopoutStore.getState().message &&
          Math.random() < 0.5
        ) {
          say({ text: randomDuckQuip(), variant: "default" });
        }
        schedule();
      }, 75000 + Math.floor(Math.random() * 45001));
    };

    schedule();
    return () => {
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, [engineRef, path, say]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || Date.now() - lastFollowAt.current < 4000) {
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      if (
        target?.closest(
          '[aria-label="Quanta buddy"], .quanta-buddy-bubble, [role="menu"], [aria-label="Quanta actions"]'
        )
      ) {
        return;
      }
      if (isFullWorkspacePath(path) && target?.closest("main")) return;

      const engine = engineRef.current;
      if (!engine?.present || engine.isBusy) return;
      lastFollowAt.current = Date.now();
      engine.walkTo(event.clientX);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [engineRef, path]);

  useEffect(() => {
    if (!progressHydrated) return;

    const amount = totalXp - previousXp.current;
    const level = getLevelFromXp(totalXp);
    const previous = previousLevel.current;
    const leveledUp = level > previous;
    const unlockedHats = leveledUp
      ? newlyUnlocked(HATS, previous, level)
      : [];
    const unlockedSkins = leveledUp
      ? newlyUnlocked(SKINS, previous, level)
      : [];
    previousXp.current = totalXp;
    previousLevel.current = level;
    const highestNewHat = [...unlockedHats].sort(
      (left, right) => right.level - left.level
    )[0];
    if (highestNewHat) {
      useQuantaBuddyStore.getState().setHat(highestNewHat.id);
    }
    if (amount <= 0) return;

    const currentMessage = useQuantaPopoutStore.getState().message;
    if (
      currentMessage &&
      Date.now() - currentMessage.updatedAt < 1500
    ) {
      return;
    }

    const engine = engineRef.current;
    if (leveledUp) {
      const unlockedNames = [...unlockedHats, ...unlockedSkins]
        .map((item) => item.name)
        .join(", ");
      const wardrobeMessage = unlockedNames
        ? ` New in my wardrobe: ${unlockedNames}. Hover over me → Wardrobe.`
        : "";
      say({
        text: `Level ${level} — ${getLevelTitle(level)}! I grew up a little.${wardrobeMessage}`,
        variant: "success",
        imageVariant: "success",
      });
    } else {
      say({
        text: `+${amount} XP! Nice work.`,
        variant: "success",
        imageVariant: "success",
      });
    }
    engine?.hop();
  }, [engineRef, progressHydrated, say, totalXp]);

  useEffect(() => {
    const wasResult = previousResult.current;
    previousResult.current = lastResult;
    if (!lastResult || wasResult === lastResult) return;

    const currentMessage = useQuantaPopoutStore.getState().message;
    if (
      currentMessage &&
      Date.now() - currentMessage.updatedAt < 1500
    ) {
      return;
    }

    say({
      text: runReactionFor(lastResult),
      variant: "success",
      imageVariant: "success",
    });
    engineRef.current?.hop();
  }, [engineRef, lastResult, say]);

  useEffect(() => {
    const wasError = previousRunError.current;
    previousRunError.current = runError;
    if (wasError !== null || runError === null) return;

    say({
      text: runErrorReaction(runError),
      title: "Quack. That didn't run",
      variant: "error",
      imageVariant: "thinking",
    });
  }, [runError, say]);

  useEffect(() => {
    const wasEmpty = previousWarningCount.current === 0;
    previousWarningCount.current = validationWarnings.length;
    if (path !== "/editor" || !wasEmpty || validationWarnings.length === 0) {
      return;
    }
    say({
      text: validationWarnings[0] ?? "That operation needs another look.",
      title: "Hmm, that doesn't fit",
      variant: "error",
      imageVariant: "thinking",
    });
  }, [path, say, validationWarnings]);

  useEffect(() => {
    const symbols = unboundSymbols(circuit);
    const hadNone = previousUnbound.current.length === 0;
    previousUnbound.current = symbols;
    if (path !== "/editor" || !hadNone || symbols.length === 0) return;
    say({
      text: `Bind ${symbols[0]} in the Parameters panel and I'll run the simulation.`,
      variant: "error",
      imageVariant: "thinking",
    });
  }, [circuit, path, say]);

  return null;
}
