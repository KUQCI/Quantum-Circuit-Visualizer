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
import { StoryboardStage } from "@/components/learning/StoryboardStage";
import { WalkthroughStage } from "@/components/learning/WalkthroughStage";
import {
  buildLessonWalkthrough,
  estimateSceneMs,
} from "@/lib/learning/lesson-walkthrough";
import {
  animatedVideoTranscript,
  getAnimatedStoryboard,
} from "@/lib/learning/animated-videos";
import { lessonVideoUrl } from "@/lib/learning/lesson-videos";
import type { LessonDefinition } from "@/lib/learning/types";
import { computeStepSnapshots } from "@/lib/step-explanations";
import { useSpeechNarrator } from "@/lib/learning/use-speech-narrator";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

export function LessonWalkthroughPlayer({
  lesson,
}: {
  lesson: LessonDefinition;
}) {
  const walkthrough = useMemo(() => buildLessonWalkthrough(lesson), [lesson]);
  const storyboard = getAnimatedStoryboard(lesson.id);
  const animatedTranscript = animatedVideoTranscript(lesson.id);
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
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [playbackRequest, setPlaybackRequest] = useState(0);
  const isNarrowViewport = useMediaQuery("(max-width: 640px)");
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playingRef = useRef(false);
  const sceneIndexRef = useRef(0);
  const sceneCount = storyboard?.beats.length ?? walkthrough.scenes.length;
  const lastSceneIndex = sceneCount - 1;
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
    const beat = storyboard?.beats[activeIndex];
    if (!scene && !beat) return;
    const caption = beat?.caption ?? scene?.caption;
    const speech = beat?.speech ?? scene?.speech;
    if (!caption || !speech) return;

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
      narrator.speak(speech, () => {
        timerRef.current = window.setTimeout(advance, 600);
      });
    } else {
      timerRef.current = window.setTimeout(
        advance,
        estimateSceneMs(caption)
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
    storyboard,
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
    setVideoBusy(false);
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
      setVideoBusy(false);
      setVideoUnavailable(false);
    } else {
      setVideoUnavailable(false);
    }
    setOpen(nextOpen);
  };

  const handleViewModeChange = (nextMode: "animated" | "video") => {
    if (nextMode === viewMode) return;
    setVideoBusy(false);
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
        <DialogHeader className="gap-1 pr-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand)]">
            Walkthrough
          </p>
          <DialogTitle className="text-xl leading-tight">
            {storyboard?.title ?? walkthrough.scenes[0]?.title ?? lesson.title}
          </DialogTitle>
          {viewMode === "animated" && (
            <DialogDescription>
              Scene {activeIndex + 1} of {sceneCount}
            </DialogDescription>
          )}
        </DialogHeader>

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

        {viewMode === "animated" ? (
          storyboard ? (
            <StoryboardStage
              key={storyboard.beats[activeIndex]?.id}
              storyboard={storyboard}
              beatIndex={activeIndex}
            />
          ) : (
            <WalkthroughStage
              walkthrough={walkthrough}
              snapshots={snapshots}
              sceneIndex={activeIndex}
              variant="dialog"
            />
          )
        ) : (
          videoUnavailable ? (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                This lesson&apos;s video isn&apos;t available yet.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={() => handleViewModeChange("animated")}>
                  Watch the animated walkthrough
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a
                    href={lessonVideoUrl(lesson.id)}
                    target="_blank"
                    rel="noopener"
                  >
                    Download MP4
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              controls
              preload="none"
              playsInline
              src={lessonVideoUrl(lesson.id)}
              aria-busy={videoBusy || undefined}
              onWaiting={() => setVideoBusy(true)}
              onCanPlay={() => setVideoBusy(false)}
              onPlaying={() => setVideoBusy(false)}
              onPause={() => setVideoBusy(false)}
              onError={() => {
                setVideoBusy(false);
                setVideoUnavailable(true);
              }}
              className="aspect-video w-full rounded-md bg-black"
            />
          )
        )}

        {viewMode === "video" && !videoUnavailable && (
          <details
            open={isNarrowViewport}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)]"
          >
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
              Transcript
            </summary>
            <ol className="max-h-[40vh] list-decimal space-y-3 overflow-y-auto border-t border-[var(--color-border)] px-8 py-3">
              {animatedTranscript
                ? animatedTranscript.map((speech, index) => (
                    <li key={index} className="pl-1">
                      <p className="text-sm [overflow-wrap:anywhere]">
                        {speech}
                      </p>
                    </li>
                  ))
                : walkthrough.scenes.map((scene, index) => (
                    <li key={`${scene.title}-${index}`} className="pl-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">
                        {scene.title}
                      </p>
                      <p className="mt-1 text-sm [overflow-wrap:anywhere]">
                        {scene.caption}
                      </p>
                    </li>
                  ))}
            </ol>
          </details>
        )}

        {viewMode === "animated" && (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                onClick={handlePlayPause}
                aria-label={
                  isPlaying ? "Pause walkthrough" : "Play walkthrough"
                }
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
              {storyboard
                ? storyboard.beats.map((beat, index) => (
                    <button
                      key={beat.id}
                      type="button"
                      aria-label={`Scene ${index + 1}: ${beat.caption}`}
                      title={beat.caption}
                      aria-current={activeIndex === index ? "step" : undefined}
                      onClick={() => jumpToScene(index)}
                      className={cn(
                        "h-3 w-3 rounded-full border border-[var(--color-border)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                        activeIndex === index
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)]"
                          : "bg-[var(--color-muted)] hover:bg-[var(--color-brand-subtle)]"
                      )}
                    />
                  ))
                : walkthrough.scenes.map((scene, index) => (
                    <button
                      key={scene.id}
                      type="button"
                      aria-label={`Scene ${index + 1}: ${scene.title}`}
                      title={scene.caption}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
