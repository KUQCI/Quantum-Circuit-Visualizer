"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WalkthroughStage } from "@/components/learning/WalkthroughStage";
import { buildLessonWalkthrough } from "@/lib/learning/lesson-walkthrough";
import { LESSONS, LESSON_IDS } from "@/lib/learning/lessons";
import { computeStepSnapshots } from "@/lib/step-explanations";

declare global {
  interface Window {
    __qcvWalkthrough?: {
      lessonIds: string[];
      lessonId: string | null;
      scenes: { id: string; title: string; caption: string; speech: string }[];
      setScene(i: number): void;
    };
  }
}

function WalkthroughVideoContent() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("lesson");
  const lesson = useMemo(
    () => LESSONS.find((item) => item.id === requestedId) ?? null,
    [requestedId]
  );
  const walkthrough = useMemo(
    () => (lesson ? buildLessonWalkthrough(lesson) : null),
    [lesson]
  );
  const snapshots = useMemo(() => {
    if (!walkthrough?.circuit) return [];
    try {
      return computeStepSnapshots(walkthrough.circuit);
    } catch {
      return [];
    }
  }, [walkthrough?.circuit]);
  const [sceneIndex, setSceneIndex] = useState(0);
  const scenes = useMemo(
    () =>
      walkthrough?.scenes.map(({ id, title, caption, speech }) => ({
        id,
        title,
        caption,
        speech,
      })) ?? [],
    [walkthrough]
  );
  const setScene = useCallback(
    (index: number) => {
      const safeIndex = Number.isFinite(index)
        ? Math.min(Math.max(0, Math.floor(index)), Math.max(0, scenes.length - 1))
        : 0;
      setSceneIndex(safeIndex);
    },
    [scenes.length]
  );

  useEffect(() => {
    setSceneIndex(0);
  }, [requestedId]);

  useEffect(() => {
    document.body.dataset.walkthroughScene = String(sceneIndex);
  }, [sceneIndex]);

  useEffect(() => {
    const api = {
      lessonIds: [...LESSON_IDS],
      lessonId: lesson?.id ?? null,
      scenes,
      setScene,
    };
    window.__qcvWalkthrough = api;
    return () => {
      if (window.__qcvWalkthrough === api) delete window.__qcvWalkthrough;
    };
  }, [lesson?.id, scenes, setScene]);

  if (!walkthrough || walkthrough.scenes.length === 0) {
    return <div className="h-[720px] w-[1280px] bg-black" />;
  }

  return (
    <WalkthroughStage
      walkthrough={walkthrough}
      snapshots={snapshots}
      sceneIndex={sceneIndex}
      variant="video"
    />
  );
}

export default function WalkthroughVideoPage() {
  return (
    <Suspense fallback={<div className="h-[720px] w-[1280px] bg-black" />}>
      <WalkthroughVideoContent />
    </Suspense>
  );
}
