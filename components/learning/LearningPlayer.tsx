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
  RotateCcw,
} from "lucide-react";

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
    <div className="flex h-[calc(100dvh-8rem)] min-h-[480px] flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2">
        <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs">
          <Link href={backHref}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </Button>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-sm font-semibold">{activity.title}</h1>
          <p className="text-[10px] capitalize text-[var(--color-muted-foreground)]">
            {activity.difficulty} · {mode}
            {isComplete && " · Completed"}
          </p>
        </div>
        <span className="academy-xp-pill text-[10px]">+{activity.xpReward} XP</span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
        {/* Left: instructions */}
        <aside className="flex flex-col border-b border-[var(--color-border)] lg:col-span-3 lg:border-b-0 lg:border-r">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <QuantaMessage
              title="Quanta"
              message={activity.quantaIntro}
              variant="default"
            />
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Instructions
              </h2>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-foreground)]">
                {storyText}
              </p>
            </div>
            {targetCircuit && (
              <div className="rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] p-3">
                <h3 className="mb-1 text-[10px] font-semibold text-[var(--color-brand)]">
                  Target circuit
                </h3>
                <p className="text-[10px] text-[var(--color-muted-foreground)]">
                  {targetCircuit.operations.length} gate(s) · {targetCircuit.qubits.length} qubit(s)
                </p>
                <ul className="mt-2 space-y-0.5 font-mono text-[10px]">
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

        {/* Center: editor */}
        <div className="flex min-h-0 flex-col lg:col-span-6">
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,180px)_1fr]">
            <div className="hidden overflow-hidden border-r border-[var(--color-border)] sm:block">
              <GateLibrary
                onDragStart={setDraggingGate}
                onDragEnd={() => setDraggingGate(null)}
              />
            </div>
            <div className="min-h-0 overflow-auto bg-[var(--color-canvas)]">
              <CircuitCanvas
                draggingGate={draggingGate}
                onDragEnd={() => setDraggingGate(null)}
              />
            </div>
          </div>
        </div>

        {/* Right: code */}
        <aside className="hidden min-h-0 flex-col border-t border-[var(--color-border)] lg:col-span-3 lg:flex lg:border-t-0 lg:border-l">
          <LearningCodePanel
            onExport={handleExportAction}
            onImportSync={handleImportSync}
          />
        </aside>
      </div>

      {/* Bottom actions */}
      <div className="shrink-0 space-y-2 border-t border-[var(--color-border)] p-3">
        <ChallengeFeedback
          status={feedbackStatus}
          message={feedbackMessage}
          quantaMessage={quantaFeedback}
          xpAwarded={xpAwarded}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-1" onClick={handleCheck}>
            <CheckCircle className="h-3.5 w-3.5" />
            Check Answer
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => setShowHint(true)}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Show Hint
          </Button>
          <Button size="sm" variant="ghost" className="gap-1" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          {feedbackStatus === "success" && nextHref && (
            <Button
              size="sm"
              variant="secondary"
              className="ml-auto gap-1"
              onClick={() => router.push(nextHref)}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Code panel wrapper that notifies learning progress on copy/sync */
function LearningCodePanel({
  onExport,
  onImportSync,
}: {
  onExport: () => void;
  onImportSync: () => void;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <MultiLanguageCodePanel />
      <div className="flex shrink-0 gap-1 border-t border-[var(--color-border)] p-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 flex-1 text-[10px]"
          onClick={onExport}
        >
          Mark Export Done
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 flex-1 text-[10px]"
          onClick={onImportSync}
        >
          Mark Import Done
        </Button>
      </div>
    </div>
  );
}
