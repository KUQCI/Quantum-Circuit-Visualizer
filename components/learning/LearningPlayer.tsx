"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircuitCanvas } from "@/components/circuit/circuit-canvas";
import { GateLibrary } from "@/components/gates/gate-library";
import { MultiLanguageCodePanel } from "@/components/code/multi-language-code-panel";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";
import { QuantaHint } from "@/components/mascot/QuantaHint";
import { ChallengeFeedback } from "@/components/learning/ChallengeFeedback";
import { checkCircuit } from "@/lib/learning/checker";
import type { ChallengeDefinition, LessonDefinition } from "@/lib/learning/types";
import { useCircuitStore } from "@/store/circuit-store";
import { useProgressStore } from "@/store/progress-store";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Lightbulb,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityDefinition = LessonDefinition | ChallengeDefinition;

function isLesson(a: ActivityDefinition): a is LessonDefinition {
  return "module" in a;
}

interface LearningPlayerProps {
  activity: ActivityDefinition;
  mode: "lesson" | "challenge";
  nextHref?: string;
  backHref: string;
}

export function LearningPlayer({
  activity,
  mode,
  nextHref,
  backHref,
}: LearningPlayerProps) {
  const router = useRouter();
  const circuit = useCircuitStore((s) => s.circuit);
  const setCircuit = useCircuitStore((s) => s.setCircuit);

  const completeLesson = useProgressStore((s) => s.completeLesson);
  const completeChallenge = useProgressStore((s) => s.completeChallenge);
  const recordExport = useProgressStore((s) => s.recordExport);
  const recordImport = useProgressStore((s) => s.recordImport);
  const recordActivity = useProgressStore((s) => s.recordActivity);
  const isComplete = useProgressStore((s) =>
    mode === "lesson"
      ? s.isLessonComplete(activity.id)
      : s.isChallengeComplete(activity.id)
  );

  const [draggingGate, setDraggingGate] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [lessonPanelOpen, setLessonPanelOpen] = useState(true);
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [quantaFeedback, setQuantaFeedback] = useState("");
  const [xpAwarded, setXpAwarded] = useState(0);
  const [exportDone, setExportDone] = useState(false);
  const [importDone, setImportDone] = useState(false);

  useEffect(() => {
    setCircuit(structuredClone(activity.starterCircuit));
    recordActivity();
    setFeedbackStatus("idle");
    setShowHint(false);
    setExportDone(false);
    setImportDone(false);
  }, [activity.id, activity.starterCircuit, setCircuit, recordActivity]);

  useEffect(() => {
    if (circuit.operations.length > 0) {
      const hasControlled = circuit.operations.some((op) => op.controls.length > 0);
      useProgressStore.getState().recordGatePlaced(hasControlled);
    }
  }, [circuit.operations]);

  const targetCircuit = useMemo(() => {
    if (!isLesson(activity) && "targetCircuit" in activity && activity.targetCircuit) {
      return activity.targetCircuit;
    }
    return null;
  }, [activity]);

  const handleReset = () => {
    setCircuit(structuredClone(activity.starterCircuit));
    setFeedbackStatus("idle");
    setShowHint(false);
  };

  const handleExportAction = useCallback(() => {
    setExportDone(true);
    recordExport();
  }, [recordExport]);

  const handleImportSync = useCallback(() => {
    setImportDone(true);
    recordImport();
  }, [recordImport]);

  const handleCheck = () => {
    const result = checkCircuit(circuit, activity.successCondition, {
      actionExportDone: exportDone,
      actionImportDone: importDone,
    });

    if (result.success) {
      let awarded = 0;
      if (!isComplete) {
        if (mode === "lesson" && isLesson(activity)) {
          const didAward = completeLesson(activity.id, activity.xpReward, activity.skills);
          if (didAward) awarded = activity.xpReward;
        } else if (mode === "challenge" && !isLesson(activity)) {
          const didAward = completeChallenge(activity.id, activity.xpReward);
          if (didAward) awarded = activity.xpReward;
        }
      }
      setXpAwarded(awarded);
      setFeedbackStatus("success");
      setFeedbackMessage(result.message);
      setQuantaFeedback(activity.quantaSuccess);
    } else {
      setFeedbackStatus("error");
      setFeedbackMessage(result.message);
      setQuantaFeedback(activity.quantaIncorrect);
    }
  };

  const storyText = isLesson(activity)
    ? activity.story
    : [
        activity.description,
        "importCode" in activity && activity.importCode
          ? `\n\nQiskit snippet:\n${activity.importCode}`
          : "",
      ].join("");

  return (
    <div className="learning-player flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-sm">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2 text-sm lg:hidden"
            onClick={() => setLessonPanelOpen((open) => !open)}
            aria-expanded={lessonPanelOpen}
            aria-label={lessonPanelOpen ? "Hide lesson panel" : "Show lesson panel"}
          >
            {lessonPanelOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Lesson</span>
          </Button>
        </div>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-base font-semibold sm:text-lg">{activity.title}</h1>
          <p className="text-sm capitalize text-[var(--color-muted-foreground)]">
            {activity.difficulty} · {mode}
            {isComplete && " · Completed"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden h-8 gap-1.5 px-2 text-sm lg:inline-flex"
            onClick={() => setLessonPanelOpen((open) => !open)}
            aria-expanded={lessonPanelOpen}
            aria-label={lessonPanelOpen ? "Hide lesson panel" : "Show lesson panel"}
          >
            {lessonPanelOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
            Lesson
          </Button>
          <span className="academy-xp-pill text-xs">+{activity.xpReward} XP</span>
        </div>
      </div>

      {/* Main 4-column workspace (desktop) */}
      <div
        className={cn(
          "learning-player-grid min-h-0 flex-1",
          !lessonPanelOpen && "learning-player-grid-lesson-collapsed"
        )}
      >
        {/* Lesson / Quanta panel */}
        <aside
          className={cn(
            "learning-panel learning-panel-lesson flex min-h-0 flex-col border-b border-[var(--color-border)] lg:border-b-0 lg:border-r",
            !lessonPanelOpen && "learning-panel-lesson-collapsed"
          )}
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <QuantaMessage
              title="Quanta"
              message={activity.quantaIntro}
              variant="default"
              size="lg"
            />
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Instructions
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)] sm:text-base">
                {storyText}
              </p>
            </div>
            {targetCircuit && (
              <div className="rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] p-4">
                <h3 className="mb-1 text-sm font-semibold text-[var(--color-brand)]">
                  Target circuit
                </h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {targetCircuit.operations.length} gate(s) · {targetCircuit.qubits.length} qubit(s)
                </p>
                <ul className="mt-2 space-y-1 font-mono text-sm">
                  {targetCircuit.operations
                    .sort((a, b) => a.column - b.column)
                    .map((op) => (
                      <li key={op.id}>
                        {op.type.toUpperCase()}{" "}
                        {op.controls.length ? `c=${op.controls.join(",")} ` : ""}
                        t={op.targets.join(",")}
                      </li>
                    ))}
                </ul>
              </div>
            )}
            <QuantaHint hint={activity.quantaHint} visible={showHint} />
          </div>
        </aside>

        {/* Operations panel */}
        <aside className="learning-panel learning-panel-ops hidden min-h-0 flex-col border-b border-[var(--color-border)] md:flex lg:border-b-0 lg:border-r">
          <GateLibrary
            variant="learning"
            onDragStart={setDraggingGate}
            onDragEnd={() => setDraggingGate(null)}
          />
        </aside>

        {/* Circuit canvas — primary focus */}
        <main className="learning-panel learning-panel-canvas min-h-[280px] min-w-0 overflow-hidden bg-[var(--color-canvas)] md:min-h-0">
          <CircuitCanvas
            draggingGate={draggingGate}
            onDragEnd={() => setDraggingGate(null)}
          />
        </main>

        {/* Code editor */}
        <aside className="learning-panel learning-panel-code hidden min-h-0 min-h-[240px] flex-col border-t border-[var(--color-border)] xl:flex xl:min-h-0 xl:border-t-0 xl:border-l">
          <LearningCodePanel
            onExport={handleExportAction}
            onImportSync={handleImportSync}
          />
        </aside>
      </div>

      {/* Mobile code panel (below canvas on smaller screens) */}
      <div className="learning-panel-code-mobile max-h-[280px] shrink-0 border-t border-[var(--color-border)] xl:hidden">
        <LearningCodePanel
          onExport={handleExportAction}
          onImportSync={handleImportSync}
        />
      </div>

      {/* Bottom actions */}
      <div className="shrink-0 space-y-2 border-t border-[var(--color-border)] px-3 py-3 sm:px-4">
        <ChallengeFeedback
          status={feedbackStatus}
          message={feedbackMessage}
          quantaMessage={quantaFeedback}
          xpAwarded={xpAwarded}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="default" className="gap-2" onClick={handleCheck}>
            <CheckCircle className="h-4 w-4" />
            Check Answer
          </Button>
          <Button size="default" variant="outline" className="gap-2" onClick={() => setShowHint(true)}>
            <Lightbulb className="h-4 w-4" />
            Show Hint
          </Button>
          <Button size="default" variant="ghost" className="gap-2" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          {feedbackStatus === "success" && nextHref && (
            <Button
              size="default"
              variant="secondary"
              className="ml-auto gap-2"
              onClick={() => router.push(nextHref)}
            >
              Next Lesson
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function LearningCodePanel({
  onExport,
  onImportSync,
}: {
  onExport: () => void;
  onImportSync: () => void;
}) {
  return (
    <div className="learning-code-panel flex h-full min-h-[220px] flex-col">
      <MultiLanguageCodePanel />
      <div className="flex shrink-0 gap-2 border-t border-[var(--color-border)] p-3">
        <Button
          size="sm"
          variant="outline"
          className="h-9 flex-1 text-sm"
          onClick={onExport}
        >
          Mark Export Done
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 flex-1 text-sm"
          onClick={onImportSync}
        >
          Mark Import Done
        </Button>
      </div>
    </div>
  );
}
