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
  DialogTrigger,
} from "@/components/ui/dialog";
import { WalkthroughStage } from "@/components/learning/WalkthroughStage";
import {
  buildLessonWalkthrough,
  estimateSceneMs,
} from "@/lib/learning/lesson-walkthrough";
import { lessonVideoUrl } from "@/lib/learning/lesson-videos";
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
  const [viewMode, setViewMode] = useState<"animated" | "video">("animated");
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [playbackRequest, setPlaybackRequest] = useState(0);
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playingRef = useRef(false);
  const sceneIndexRef = useRef(0);
  const lastSceneIndex = walkthrough.scenes.length - 1;
  const activeIndex = Math.min(sceneIndex, lastSceneIndex);

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
    videoRef.current?.pause();
    playingRef.current = false;
    sceneIndexRef.current = 0;
    setIsPlaying(false);
    setSceneIndex(0);
    setViewMode("animated");
    setVideoUnavailable(false);
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
      videoRef.current?.pause();
      playingRef.current = false;
      sceneIndexRef.current = 0;
      setIsPlaying(false);
      setSceneIndex(0);
      setPlaybackRequest((value) => value + 1);
      setViewMode("animated");
      setVideoUnavailable(false);
    }
    setOpen(nextOpen);
  };

  const handleViewModeChange = (nextMode: "animated" | "video") => {
    if (nextMode === viewMode) return;
    if (nextMode === "video") {
      playingRef.current = false;
      cancelPlayback();
      setIsPlaying(false);
      setVideoUnavailable(false);
    } else {
      videoRef.current?.pause();
    }
    setViewMode(nextMode);
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
        {viewMode === "animated" ? (
          <WalkthroughStage
            walkthrough={walkthrough}
            snapshots={snapshots}
            sceneIndex={activeIndex}
            variant="dialog"
          />
        ) : (
          <div className="space-y-2">
            <video
              ref={videoRef}
              controls
              preload="none"
              playsInline
              src={lessonVideoUrl(lesson.id)}
              onError={() => setVideoUnavailable(true)}
              className="aspect-video w-full rounded-md bg-black"
            />
            {videoUnavailable && (
              <p className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-muted-foreground)]">
                <span>
                  This lesson&apos;s video isn&apos;t available yet. The animated
                  walkthrough above works offline.
                </span>
                <a
                  href={lessonVideoUrl(lesson.id)}
                  target="_blank"
                  rel="noopener"
                  className="font-medium text-[var(--color-brand)] underline underline-offset-2"
                >
                  Download MP4
                </a>
              </p>
            )}
          </div>
        )}

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

        <div
          aria-label="Walkthrough display"
          className="flex justify-center gap-1 rounded-md border border-[var(--color-border)] p-1"
        >
          <Button
            size="sm"
            variant={viewMode === "animated" ? "secondary" : "ghost"}
            aria-pressed={viewMode === "animated"}
            onClick={() => handleViewModeChange("animated")}
          >
            Animated
          </Button>
          <Button
            size="sm"
            variant={viewMode === "video" ? "secondary" : "ghost"}
            aria-pressed={viewMode === "video"}
            onClick={() => handleViewModeChange("video")}
          >
            Video
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
