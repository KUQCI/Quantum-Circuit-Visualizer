"use client";

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LessonCircuitSvg } from "@/components/learning/LessonCircuitPreview";
import { ProbabilityChart } from "@/components/visualizations/probability-chart";
import { QSphere } from "@/components/visualizations/q-sphere";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { LESSONS } from "@/lib/learning/lessons";
import { MODULE_LABELS, type ModuleId } from "@/lib/learning/progress";
import type { LessonWalkthrough } from "@/lib/learning/lesson-walkthrough";
import type { StepSnapshot } from "@/lib/step-explanations";

interface WalkthroughStageProps {
  walkthrough: LessonWalkthrough;
  snapshots: StepSnapshot[];
  sceneIndex: number;
  variant: "dialog" | "video";
}

export function WalkthroughStage({
  walkthrough,
  snapshots,
  sceneIndex,
  variant,
}: WalkthroughStageProps) {
  const activeIndex = Math.min(
    Math.max(0, sceneIndex),
    walkthrough.scenes.length - 1
  );
  const scene = walkthrough.scenes[activeIndex];
  const snapshot =
    scene?.snapshotStep === null || scene?.snapshotStep === undefined
      ? null
      : snapshots[scene.snapshotStep] ?? null;

  if (variant === "video") {
    const lesson = LESSONS.find((item) => item.id === walkthrough.lessonId);
    const moduleLabel = lesson
      ? MODULE_LABELS[lesson.module as ModuleId] ?? lesson.module
      : "";
    const title = walkthrough.scenes[0]?.title ?? walkthrough.lessonId;
    const logoSrc = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icons/icon-192.png`;

    return (
      <div
        data-theme="dark"
        className="flex h-[720px] w-[1280px] shrink-0 flex-col overflow-hidden bg-[var(--color-background)] p-8 text-[var(--color-foreground)]"
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="QCI"
              width={42}
              height={42}
              className="h-[42px] w-[42px] rounded-lg"
            />
            <span className="text-xl font-bold tracking-tight">
              Quanta Academy
            </span>
          </div>
          <p className="text-lg font-medium text-[var(--color-muted-foreground)]">
            {moduleLabel} · {title}
          </p>
          <p className="text-base font-semibold text-[var(--color-brand)]">
            Scene {activeIndex + 1} of {walkthrough.scenes.length}
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 pt-5">
          {walkthrough.circuit ? (
            <>
              <div className="flex h-[156px] shrink-0 items-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-8">
                <div className="w-full">
                  <LessonCircuitSvg
                    circuit={walkthrough.circuit}
                    selectedStep={scene.visibleSteps}
                    visibleSteps={scene.visibleSteps}
                  />
                </div>
              </div>
              {snapshot && (
                <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
                  <section
                    aria-label="State probabilities"
                    className="min-h-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-4"
                  >
                    <ProbabilityChart
                      probabilities={snapshot.after.probabilities}
                      numQubits={snapshot.after.numQubits}
                      error={snapshot.after.error}
                    />
                  </section>
                  <section
                    aria-label="Q-sphere"
                    className="min-h-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-3"
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
            </>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <QuantaImage
                variant="learning"
                size={256}
                alt="Quanta ready to guide the lesson"
              />
            </div>
          )}

          <div className="flex h-[148px] shrink-0 items-center gap-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-7 py-5 shadow-[var(--shadow-card)]">
            <QuantaImage
              variant="learning"
              size={72}
              bare
              alt="Quanta"
              className="h-[72px] w-[72px]"
            />
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-brand)]">
                {scene.title}
              </p>
              <p className="text-[22px] leading-relaxed text-[var(--color-foreground)]">
                {scene.caption}
              </p>
            </div>
            <div
              aria-hidden="true"
              className="flex shrink-0 items-center gap-2 pl-4"
            >
              {walkthrough.scenes.map((item, index) => (
                <span
                  key={item.id}
                  className={
                    index === activeIndex
                      ? "h-3 w-3 rounded-full bg-[var(--color-brand)]"
                      : "h-2.5 w-2.5 rounded-full bg-[var(--color-border-strong)]"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DialogHeader className="gap-1 pr-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand)]">
          Walkthrough
        </p>
        <DialogTitle className="text-xl leading-tight">
          {walkthrough.scenes[0]?.title ?? walkthrough.lessonId}
        </DialogTitle>
        <DialogDescription>
          Scene {activeIndex + 1} of {walkthrough.scenes.length}
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[30vh] min-h-[108px] overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2 sm:max-h-[24vh]">
        {walkthrough.circuit ? (
          <LessonCircuitSvg
            circuit={walkthrough.circuit}
            selectedStep={scene.visibleSteps}
            visibleSteps={scene.visibleSteps}
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
            {scene.title}
          </p>
          <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
            {scene.caption}
          </p>
        </div>
      </div>
    </>
  );
}
