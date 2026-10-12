"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pause,
  Play,
  PlayCircle,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LessonCircuitSvg } from "@/components/learning/LessonCircuitPreview";
import { ProbabilityChart } from "@/components/visualizations/probability-chart";
import { QSphere } from "@/components/visualizations/q-sphere";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import {
  buildLessonWalkthrough,
  estimateSceneMs,
} from "@/lib/learning/lesson-walkthrough";
import type { LessonDefinition } from "@/lib/learning/types";
import { computeStepSnapshots } from "@/lib/step-explanations";
import { useSpeechNarrator } from "@/lib/learning/use-speech-narrator";
import { cn } from "@/lib/utils";

export function LessonWalkthroughPlayer({
  lesson,
}: {
  lesson: LessonDefinition;
}) {
  const walkthrough = useMemo(() => buildLessonWalkthrough(lesson), [lesson]);
  const snapshots = useMemo(() => {
    if (!walkthrough.circuit) return [];
    try {
      return computeStepSnapshots(walkthrough.circuit);
    } catch {
      return [];
    }
  }, [walkthrough.circuit]);
  const narrator = useSpeechNarrator();
  const [open, setOpen] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [playbackRequest, setPlaybackRequest] = useState(0);
  const timerRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const sceneIndexRef = useRef(0);
  const lastSceneIndex = walkthrough.scenes.length - 1;
  const activeIndex = Math.min(sceneIndex, lastSceneIndex);
  const activeScene = walkthrough.scenes[activeIndex];
  const snapshot =
    activeScene.snapshotStep === null
      ? null
      : snapshots[activeScene.snapshotStep] ?? null;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelPlayback = useCallback(() => {
    clearTimer();
    narrator.cancel();
  }, [clearTimer, narrator]);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    sceneIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (!open || !isPlaying) return;
    const scene = walkthrough.scenes[activeIndex];
    if (!scene) return;

    const advance = () => {
      timerRef.current = null;
      if (!playingRef.current) return;
      if (sceneIndexRef.current >= lastSceneIndex) {
        playingRef.current = false;
        setIsPlaying(false);
        return;
      }

      const nextIndex = sceneIndexRef.current + 1;
      sceneIndexRef.current = nextIndex;
      setSceneIndex(nextIndex);
    };

    if (narrator.supported && voiceEnabled) {
      narrator.speak(scene.speech, () => {
        timerRef.current = window.setTimeout(advance, 600);
      });
    } else {
      timerRef.current = window.setTimeout(
        advance,
        estimateSceneMs(scene.caption)
      );
    }

    return () => {
      clearTimer();
      narrator.cancel();
    };
  }, [
    activeIndex,
    clearTimer,
    isPlaying,
    lastSceneIndex,
    narrator,
    open,
    playbackRequest,
    voiceEnabled,
    walkthrough.scenes,
  ]);

  useEffect(() => {
    cancelPlayback();
    playingRef.current = false;
    sceneIndexRef.current = 0;
    setIsPlaying(false);
    setSceneIndex(0);
  }, [cancelPlayback, lesson.id]);

  useEffect(
    () => () => {
      clearTimer();
      narrator.cancel();
    },
    [clearTimer, narrator]
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      cancelPlayback();
      playingRef.current = false;
      sceneIndexRef.current = 0;
      setIsPlaying(false);
      setSceneIndex(0);
      setPlaybackRequest((value) => value + 1);
    }
    setOpen(nextOpen);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      playingRef.current = false;
      cancelPlayback();
      setIsPlaying(false);
      return;
    }

    playingRef.current = true;
    setIsPlaying(true);
    setPlaybackRequest((value) => value + 1);
  };

  const jumpToScene = (nextIndex: number) => {
    const wasPlaying = playingRef.current;
    cancelPlayback();
    sceneIndexRef.current = nextIndex;
    setSceneIndex(nextIndex);
    if (wasPlaying) {
      setIsPlaying(true);
      setPlaybackRequest((value) => value + 1);
    }
  };

  const handleRestart = () => {
    cancelPlayback();
    sceneIndexRef.current = 0;
    setSceneIndex(0);
    playingRef.current = true;
    setIsPlaying(true);
    setPlaybackRequest((value) => value + 1);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full justify-center gap-2">
          <PlayCircle className="h-4 w-4" />
          Watch walkthrough
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl gap-4 p-4 sm:p-6">
        <DialogHeader className="gap-1 pr-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand)]">
            Walkthrough
          </p>
          <DialogTitle className="text-xl leading-tight">
            {lesson.title}
          </DialogTitle>
          <DialogDescription>
            Scene {activeIndex + 1} of {walkthrough.scenes.length}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[30vh] min-h-[108px] overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2 sm:max-h-[24vh]">
          {walkthrough.circuit ? (
            <LessonCircuitSvg
              circuit={walkthrough.circuit}
              selectedStep={activeScene.visibleSteps}
              visibleSteps={activeScene.visibleSteps}
            />
          ) : (
            <div className="flex h-28 items-center justify-center">
              <QuantaImage
                variant="learning"
                size={96}
                alt="Quanta ready to guide the lesson"
              />
            </div>
          )}
        </div>

        {snapshot && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section
              aria-label="State probabilities"
              className="h-[180px] min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2"
            >
              <ProbabilityChart
                probabilities={snapshot.after.probabilities}
                numQubits={snapshot.after.numQubits}
                error={snapshot.after.error}
              />
            </section>
            <section
              aria-label="Q-sphere"
              className="h-[220px] min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2"
            >
              <QSphere
                points={snapshot.after.qSpherePoints}
                blochVector={snapshot.after.blochVector}
                numQubits={snapshot.after.numQubits}
                error={snapshot.after.error}
              />
            </section>
          </div>
        )}

        <div
          aria-live="polite"
          aria-atomic="true"
          className="flex min-h-16 items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/35 p-3"
        >
          <QuantaImage
            variant="learning"
            size={40}
            bare
            alt="Quanta"
            className="h-10 w-10"
          />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">
              {activeScene.title}
            </p>
            <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
              {activeScene.caption}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            size="sm"
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause walkthrough" : "Play walkthrough"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => jumpToScene(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            aria-label="Previous scene"
          >
            <SkipBack className="h-4 w-4" />
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              jumpToScene(Math.min(lastSceneIndex, activeIndex + 1))
            }
            disabled={activeIndex === lastSceneIndex}
            aria-label="Next scene"
          >
            <SkipForward className="h-4 w-4" />
            Next
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRestart}
            aria-label="Restart walkthrough"
          >
            <RotateCcw className="h-4 w-4" />
            Restart
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setVoiceEnabled((enabled) => !enabled)}
            disabled={!narrator.supported}
            aria-pressed={voiceEnabled}
            aria-label={voiceEnabled ? "Turn voice off" : "Turn voice on"}
          >
            {voiceEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            Voice
          </Button>
        </div>

        {!narrator.supported && (
          <p className="text-center text-xs text-[var(--color-muted-foreground)]">
            Voice isn&apos;t available in this browser, so captions only.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {walkthrough.scenes.map((scene, index) => (
            <button
              key={scene.id}
              type="button"
              aria-label={`Scene ${index + 1}: ${scene.title}`}
              aria-current={activeIndex === index ? "step" : undefined}
              onClick={() => jumpToScene(index)}
              className={cn(
                "h-3 w-3 rounded-full border border-[var(--color-border)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                activeIndex === index
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)]"
                  : "bg-[var(--color-muted)] hover:bg-[var(--color-brand-subtle)]"
              )}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
