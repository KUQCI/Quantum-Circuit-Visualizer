"use client";

import { useMemo } from "react";
import { LessonCircuitSvg } from "@/components/learning/LessonCircuitPreview";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { ProbabilityChart } from "@/components/visualizations/probability-chart";
import {
  storyboardSceneToCircuit,
  type AnimatedStoryboard,
  type AnimatedStoryboardBeat,
  type AnimatedStoryboardScene,
} from "@/lib/learning/animated-videos";
import { MODULE_LABELS, MODULE_ORDER } from "@/lib/learning/progress";
import { computeStepSnapshots } from "@/lib/step-explanations";

function TitleScene({ storyboard }: { storyboard: AnimatedStoryboard }) {
  const isFirstModule =
    storyboard.module === MODULE_LABELS[MODULE_ORDER[0]];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-5 text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
        {storyboard.module}
      </span>
      <h2 className="max-w-full animate-storyboard-pop text-2xl font-bold leading-tight sm:text-4xl">
        {storyboard.title}
      </h2>
      <QuantaImage
        variant={isFirstModule ? "learning" : "welcome"}
        size={78}
        bare
        alt="Quanta"
        className="animate-storyboard-bob"
      />
    </div>
  );
}

function CircuitScene({
  scene,
  lessonTitle,
}: {
  scene: Extract<AnimatedStoryboardScene, { kind: "circuit" }>;
  lessonTitle: string;
}) {
  const circuit = useMemo(
    () => storyboardSceneToCircuit(scene, lessonTitle),
    [lessonTitle, scene]
  );
  const snapshots = useMemo(() => {
    try {
      return computeStepSnapshots(circuit);
    } catch {
      return [];
    }
  }, [circuit]);
  const state = snapshots.at(-1)?.after;
  const animatedIds = scene.gates
    .slice(scene.reveal, scene.reveal + scene.add)
    .map((_, index) => `storyboard-gate-${scene.reveal + index}`);
  const highlightedIds = (scene.highlight ?? []).map(
    (index) => `storyboard-gate-${index}`
  );
  const hasProbabilityPanel = scene.panels.includes("probabilities");
  const fallbackPanels = scene.panels.filter(
    (panel) => panel !== "probabilities"
  );
  const mobileProbabilities = state?.probabilities.filter(
    ({ label, probability }) =>
      probability > 1e-6 || label === "|000⟩"
  ) ?? [];

  return (
    <div
      className={`grid h-full ${
        hasProbabilityPanel
          ? "grid-rows-[100px_140px] sm:min-h-0 sm:grid-rows-[3fr_2fr]"
          : scene.qubits > 1
            ? "min-h-0 grid-rows-[3fr_2fr]"
            : "min-h-0 grid-rows-[2fr_3fr]"
      } gap-1.5 p-2`}
    >
      <div className="min-h-0 overflow-hidden rounded-lg border border-slate-700/80 bg-slate-900/80 p-1">
        <LessonCircuitSvg
          circuit={circuit}
          selectedStep={0}
          visibleSteps={circuit.operations.length}
          animatedOperationIds={animatedIds}
          highlightedOperationIds={highlightedIds}
          fillContainer
        />
      </div>
      <div
        className={`min-h-[140px] overflow-hidden rounded-lg border border-slate-700/80 bg-slate-900/80 p-1.5 ${
          hasProbabilityPanel ? "sm:min-h-0" : ""
        }`}
      >
        {state && hasProbabilityPanel ? (
          <>
            <div className="h-full min-h-0 sm:hidden">
              <ProbabilityChart
                probabilities={mobileProbabilities}
                numQubits={state.numQubits}
                error={state.error}
                compact
              />
            </div>
            <div className="hidden h-full min-h-0 sm:block">
              <ProbabilityChart
                probabilities={state.probabilities}
                numQubits={state.numQubits}
                error={state.error}
              />
            </div>
          </>
        ) : state ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
              {fallbackPanels.join(" · ") || "State readout"}
            </span>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-xs text-slate-100 sm:text-sm">
              {state.probabilities
                .filter(({ probability }) => probability > 0.001)
                .map(({ label, probability }) => (
                  <span key={label}>
                    |{label}⟩ {Math.round(probability * 100)}%
                  </span>
                ))}
            </div>
          </div>
        ) : (
          <p className="flex h-full items-center justify-center text-xs text-slate-300">
            State preview unavailable
          </p>
        )}
      </div>
    </div>
  );
}

function HistogramScene({
  scene,
}: {
  scene: Extract<AnimatedStoryboardScene, { kind: "histogram" }>;
}) {
  const entries = Object.entries(scene.counts);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const maximum = Math.max(...entries.map(([, count]) => count), 1);

  return (
    <div className="flex h-full flex-col gap-2 px-4 py-3">
      <h2 className="text-center text-sm font-semibold text-slate-100 sm:text-base">
        {scene.title}
      </h2>
      <div className="flex min-h-0 flex-1 items-end justify-center gap-3 border-b border-slate-600 pb-1">
        {entries.map(([label, count], index) => {
          const percent = total ? Math.round((count / total) * 100) : 0;
          return (
            <div
              key={label}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              <span className="text-[10px] text-slate-300">
                {count} · {percent}%
              </span>
              <div className="flex h-[68%] w-full max-w-16 items-end">
                <div
                  className="animate-storyboard-bar w-full rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-300"
                  style={{
                    height: `${(count / maximum) * 100}%`,
                    animationDelay: `${index * 100}ms`,
                  }}
                />
              </div>
              <span className="font-mono text-xs text-slate-100">
                |{label}⟩
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardsScene({
  scene,
}: {
  scene: Extract<AnimatedStoryboardScene, { kind: "cards" }>;
}) {
  return (
    <div className="flex h-full flex-col gap-3 p-3 sm:gap-4 sm:p-5">
      <h2 className="text-center text-base font-bold text-slate-100 sm:text-xl">
        {scene.heading}
      </h2>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
        {scene.items.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="animate-storyboard-item flex min-h-0 flex-col justify-center rounded-xl border border-slate-600 bg-slate-800/90 p-2 shadow-lg sm:p-3"
            style={{ animationDelay: `${index * 140}ms` }}
          >
            <h3 className="text-xs font-semibold text-cyan-200 sm:text-sm">
              {item.title}
            </h3>
            <p className="mt-1 text-[10px] leading-snug text-slate-200 sm:text-xs">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeScene({
  scene,
}: {
  scene: Extract<AnimatedStoryboardScene, { kind: "code" }>;
}) {
  return (
    <div className="flex h-full flex-col p-3 sm:p-5">
      <div className="mb-2 flex justify-end">
        <span className="rounded-full border border-cyan-700 bg-cyan-950 px-2 py-0.5 font-mono text-[10px] text-cyan-200">
          {scene.language}
        </span>
      </div>
      <pre className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 p-3 font-mono text-[10px] leading-relaxed text-emerald-200 sm:text-sm">
        <code>
          {scene.lines.map((line, index) => (
            <span
              key={`${line}-${index}`}
              className="animate-storyboard-item block whitespace-pre-wrap"
              style={{ animationDelay: `${index * 180}ms` }}
            >
              {line}
              {index < scene.lines.length - 1 ? "\n" : ""}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function OutroScene({
  scene,
}: {
  scene: Extract<AnimatedStoryboardScene, { kind: "outro" }>;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <QuantaImage
        variant="success"
        size={72}
        bare
        alt="Quanta waving"
        className="animate-storyboard-wave"
      />
      <h2 className="text-xl font-bold text-slate-50 sm:text-2xl">
        {scene.title}
      </h2>
      <div className="flex flex-wrap justify-center gap-1.5">
        {(scene.chips ?? []).map((chip, index) => (
          <span
            key={`${chip}-${index}`}
            className="animate-storyboard-item rounded-full border border-cyan-700 bg-cyan-950/80 px-2.5 py-1 text-[10px] font-medium text-cyan-100 sm:text-xs"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function SceneContent({
  scene,
  storyboard,
}: {
  scene: AnimatedStoryboardBeat["scene"];
  storyboard: AnimatedStoryboard;
}) {
  switch (scene.kind) {
    case "title":
      return <TitleScene storyboard={storyboard} />;
    case "circuit":
      return <CircuitScene scene={scene} lessonTitle={storyboard.title} />;
    case "histogram":
      return <HistogramScene scene={scene} />;
    case "cards":
      return <CardsScene scene={scene} />;
    case "code":
      return <CodeScene scene={scene} />;
    case "outro":
      return <OutroScene scene={scene} />;
  }
}

export function StoryboardStage({
  storyboard,
  beatIndex,
}: {
  storyboard: AnimatedStoryboard;
  beatIndex: number;
}) {
  const activeIndex = Math.min(
    Math.max(0, beatIndex),
    storyboard.beats.length - 1
  );
  const beat = storyboard.beats[activeIndex];

  if (!beat) return null;
  const hasProbabilityPanel =
    beat.scene.kind === "circuit" &&
    beat.scene.panels.includes("probabilities");

  return (
    <div className="space-y-2">
      <div
        data-theme="dark"
        data-testid="storyboard-stage"
        data-storyboard-beat={beat.id}
        role="group"
        aria-label={`${storyboard.title}: ${beat.caption}`}
        className={`${
          hasProbabilityPanel
            ? "aspect-auto sm:aspect-video"
            : "aspect-video"
        } w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950 text-slate-100 shadow-xl`}
      >
        <SceneContent scene={beat.scene} storyboard={storyboard} />
      </div>
      <p className="min-h-10 text-sm leading-relaxed text-[var(--color-foreground)] [overflow-wrap:anywhere]">
        {beat.caption}
      </p>
    </div>
  );
}
