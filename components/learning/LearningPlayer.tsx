"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircuitCanvas } from "@/components/circuit/circuit-canvas";
import { GateLibrary } from "@/components/gates/gate-library";
import { MultiLanguageCodePanel } from "@/components/code/multi-language-code-panel";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";
import { QuantaAchievement } from "@/components/mascot/QuantaAchievement";
import { QuantaHint } from "@/components/mascot/QuantaHint";
import { ChallengeFeedback } from "@/components/learning/ChallengeFeedback";
import { NextStepCard } from "@/components/navigation/NextStepCard";
import { FeatureErrorBoundary } from "@/components/errors/FeatureErrorBoundary";
import { checkCircuit } from "@/lib/learning/checker";
import type { ChallengeDefinition, LessonDefinition } from "@/lib/learning/types";
import type { CodeLanguageId } from "@/lib/code-adapters";
import { useCircuitStore } from "@/store/circuit-store";
import { useProgressStore } from "@/store/progress-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { useMediaQuery, COMPACT_VIEWPORT_QUERY } from "@/lib/use-media-query";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";
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
import { cn, pluralize } from "@/lib/utils";
import { getLevelTitle, xpForNextLevel } from "@/lib/learning/progress";

type ActivityDefinition = LessonDefinition | ChallengeDefinition;
type LessonStage = "learn" | "quiz" | "build" | "done";

function isLesson(a: ActivityDefinition): a is LessonDefinition {
  return "module" in a;
}

interface LearningPlayerProps {
  activity: ActivityDefinition;
  mode: "lesson" | "challenge";
  nextHref?: string;
  prevHref?: string;
  relatedHref?: string;
  relatedLabel?: string;
  backHref: string;
}

export function LearningPlayer({
  activity,
  mode,
  nextHref,
  prevHref,
  relatedHref,
  relatedLabel,
  backHref,
}: LearningPlayerProps) {
  const router = useRouter();
  const circuit = useCircuitStore((s) => s.circuit);
  const setActivityCircuit = useCircuitStore((s) => s.setActivityCircuit);
  const enterActivityCircuit = useCircuitStore((s) => s.enterActivityCircuit);
  const exitActivityCircuit = useCircuitStore((s) => s.exitActivityCircuit);
  const commitActivityToWorkspace = useCircuitStore(
    (s) => s.commitActivityToWorkspace
  );
  const circuitHydrated = usePersistHydrated(useCircuitStore.persist);
  const isWideLayout = useMediaQuery("(min-width: 1280px)");
  const isCompact = useMediaQuery(COMPACT_VIEWPORT_QUERY);

  const completeLesson = useProgressStore((s) => s.completeLesson);
  const completeChallenge = useProgressStore((s) => s.completeChallenge);
  const recordQuizResult = useProgressStore((s) => s.recordQuizResult);
  const awardXp = useProgressStore((s) => s.awardXp);
  const recordExport = useProgressStore((s) => s.recordExport);
  const recordImport = useProgressStore((s) => s.recordImport);
  const recordActivity = useProgressStore((s) => s.recordActivity);
  const isComplete = useProgressStore((s) =>
    mode === "lesson"
      ? s.isLessonComplete(activity.id)
      : s.isChallengeComplete(activity.id)
  );

  const [draggingGate, setDraggingGate] = useState<string | null>(null);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [lessonPanelOpen, setLessonPanelOpen] = useState(() =>
    typeof window !== "undefined"
      ? !window.matchMedia(COMPACT_VIEWPORT_QUERY).matches
      : true
  );

  useEffect(() => {
    setLessonPanelOpen(!isCompact);
  }, [isCompact]);
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [quantaFeedback, setQuantaFeedback] = useState("");
  const [xpAwarded, setXpAwarded] = useState(0);
  const [exportDone, setExportDone] = useState(false);
  const [exportedLanguages, setExportedLanguages] = useState<CodeLanguageId[]>([]);
  const [importDone, setImportDone] = useState(false);
  const [stage, setStage] = useState<LessonStage>(
    mode === "lesson" ? (isComplete ? "done" : "learn") : "build"
  );
  const [sectionIndex, setSectionIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizWrongAttempts, setQuizWrongAttempts] = useState(0);
  const [quizFirstTry, setQuizFirstTry] = useState(true);
  const [maxStageReached, setMaxStageReached] = useState(
    mode === "lesson" ? (isComplete ? 3 : 0) : 2
  );
  const isCompleteRef = useRef(isComplete);
  const modeRef = useRef(mode);

  useEffect(() => {
    isCompleteRef.current = isComplete;
  }, [isComplete]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    const completed = isCompleteRef.current;
    const currentMode = modeRef.current;

    enterActivityCircuit(structuredClone(activity.starterCircuit));
    recordActivity();
    setFeedbackStatus("idle");
    setShowHint(false);
    setExportDone(false);
    setExportedLanguages([]);
    setImportDone(false);
    setStage(
      currentMode === "lesson" ? (completed ? "done" : "learn") : "build"
    );
    setSectionIndex(0);
    setQuizChoice(null);
    setQuizChecked(false);
    setQuizIndex(0);
    setQuizWrongAttempts(0);
    setQuizFirstTry(true);
    setMaxStageReached(
      currentMode === "lesson" ? (completed ? 3 : 0) : 2
    );
    setQuantaFeedback("");
    useEditorUiStore.getState().setInspectMode(false);

    const reloadStarter = () => {
      if (cancelled) return;
      // Hydration finished — refresh starter without remounting activity depth.
      setActivityCircuit(structuredClone(activity.starterCircuit));
    };
    const unsub = useCircuitStore.persist.onFinishHydration(reloadStarter);

    return () => {
      cancelled = true;
      unsub();
      exitActivityCircuit();
    };
  }, [
    activity.id,
    activity.starterCircuit,
    enterActivityCircuit,
    exitActivityCircuit,
    setActivityCircuit,
    recordActivity,
  ]);

  useEffect(() => {
    const currentStageIndex = (["learn", "quiz", "build", "done"] as LessonStage[]).indexOf(stage);
    setMaxStageReached((value) => Math.max(value, currentStageIndex));
  }, [stage]);

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
    setActivityCircuit(structuredClone(activity.starterCircuit));
    setFeedbackStatus("idle");
    setShowHint(false);
  };

  const handleExportAction = useCallback((language: CodeLanguageId) => {
    setExportDone(true);
    setExportedLanguages((current) =>
      current.includes(language) ? current : [...current, language]
    );
    recordExport();
  }, [recordExport]);

  const handleImportSync = useCallback(() => {
    setImportDone(true);
    recordImport();
  }, [recordImport]);

  const handleCheck = () => {
    if (mode === "lesson" && isLesson(activity) && stage === "quiz") {
      const question = activity.quiz[quizIndex];
      const correct = quizChoice === question.answerIndex;
      if (quizChecked && (correct || quizWrongAttempts >= 2)) {
        if (quizIndex < activity.quiz.length - 1) {
          setQuizIndex((value) => value + 1);
          setQuizChoice(null);
          setQuizChecked(false);
          setQuizWrongAttempts(0);
          setFeedbackStatus("idle");
          setFeedbackMessage("");
          setQuantaFeedback("");
          return;
        }
        recordQuizResult(activity.id, quizFirstTry);
        setFeedbackStatus("idle");
        setFeedbackMessage("");
        setQuantaFeedback("");
        setStage("build");
        return;
      }
      setQuizChecked(true);
      if (!correct) {
        setQuizFirstTry(false);
        const attempts = quizWrongAttempts + 1;
        setQuizWrongAttempts(attempts);
        setFeedbackStatus("error");
        setFeedbackMessage("Not quite — try again.");
        setQuantaFeedback(
          attempts >= 2
            ? `Here's the explanation: ${question.explanation}`
            : activity.quantaIncorrect
        );
        return;
      }
      setQuantaFeedback(question.explanation);
      setFeedbackStatus("success");
      setFeedbackMessage("Quiz answer correct!");
      return;
    }
    if (mode === "lesson" && stage !== "build") return;
    const result = checkCircuit(circuit, activity.successCondition, {
      actionExportDone: exportDone,
      exportedLanguages,
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
      if (
        mode === "lesson" &&
        isLesson(activity) &&
        !isComplete &&
        quizFirstTry
      ) {
        awardXp(10, "First-try quiz bonus");
        awarded += 10;
      }
      setXpAwarded(awarded);
      if (mode === "lesson") setStage("done");
      setFeedbackStatus("success");
      setFeedbackMessage(result.message);
      setQuantaFeedback(activity.quantaSuccess);
    } else {
      setFeedbackStatus("error");
      setFeedbackMessage(result.message);
      setQuantaFeedback(activity.quantaIncorrect);
    }
  };

  const handleOpenInBuild = () => {
    commitActivityToWorkspace();
    router.push("/editor");
  };

  const nextLabel = mode === "lesson" ? "Next Lesson" : "Next Challenge";
  const panelLabel = mode === "lesson" ? "Guide" : "Briefing";

  const storyText = isLesson(activity)
    ? activity.story
    : [
        activity.description,
        "importCode" in activity && activity.importCode
          ? `\n\nQiskit snippet:\n${activity.importCode}`
          : "",
      ].join("");

  if (!circuitHydrated) {
    return (
      <div className="learning-player flex h-full min-h-0 w-full items-center justify-center border-y border-[var(--color-border)] bg-[var(--color-background)] p-8 text-sm text-[var(--color-muted-foreground)]">
        Loading {mode}…
      </div>
    );
  }

  return (
    <div className="learning-player flex min-h-0 w-full flex-col border-y border-[var(--color-border)] bg-[var(--color-background)] md:h-full md:overflow-hidden">
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
            <span className="hidden sm:inline">{panelLabel}</span>
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
            {panelLabel}
          </Button>
          {selectedGate && (
            <span className="hidden text-xs text-[var(--color-brand)] sm:inline">
              Tap a wire to place {selectedGate.toUpperCase()}
            </span>
          )}
          <span className="academy-xp-pill text-xs">+{activity.xpReward} XP</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-center gap-1 border-b border-[var(--color-border)] px-3 py-2">
        {(["learn", "quiz", "build", "done"] as LessonStage[]).map((item, index) => (
          <div key={item} className="flex items-center gap-1">
            <button
              type="button"
              disabled={index > maxStageReached}
              onClick={() => {
                setStage(item);
                setFeedbackStatus("idle");
                setFeedbackMessage("");
                setQuantaFeedback("");
              }}
              className={cn(
                "rounded-full px-2 py-1 text-[10px] font-semibold uppercase",
                stage === item
                  ? "bg-[var(--color-brand)] text-white"
                  : index < (["learn", "quiz", "build", "done"] as LessonStage[]).indexOf(stage)
                    ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] hover:underline"
                    : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
              )}
            >
              {index + 1}. {item}
            </button>
            {index < 3 && <ChevronRight className="h-3 w-3 text-[var(--color-muted-foreground)]" />}
          </div>
        ))}
      </div>

      {/* Main workspace */}
      <FeatureErrorBoundary
        title="Lesson workspace error"
        description="This lesson view hit an unexpected error. You can retry or reset saved browser data."
        resetHref={backHref}
      >
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
              message={quantaFeedback || activity.quantaIntro}
              variant={
                feedbackStatus === "error"
                  ? "error"
                  : feedbackStatus === "success"
                    ? "success"
                    : "default"
              }
              size="lg"
              imageVariant={
                feedbackStatus === "error"
                  ? "thinking"
                  : feedbackStatus === "success"
                    ? "success"
                    : "learning"
              }
            />
            {mode === "lesson" && isLesson(activity) && stage === "learn" ? (
              <LessonSectionCard
                lesson={activity}
                index={sectionIndex}
                onPrevious={() => setSectionIndex((value) => Math.max(0, value - 1))}
                onNext={() =>
                  sectionIndex < activity.sections.length - 1
                    ? setSectionIndex((value) => value + 1)
                    : setStage("quiz")
                }
              />
            ) : mode === "lesson" && isLesson(activity) && stage === "quiz" ? (
              <QuizCard
                lesson={activity}
                index={quizIndex}
                choice={quizChoice}
                checked={quizChecked}
                wrongAttempts={quizWrongAttempts}
                onChoice={(value) => {
                  setQuizChoice(value);
                  setQuizChecked(false);
                  setFeedbackStatus("idle");
                  setFeedbackMessage("");
                  setQuantaFeedback("");
                }}
                onCheck={handleCheck}
              />
            ) : stage === "done" ? (
              <DoneCard
                lesson={mode === "lesson" && isLesson(activity) ? activity : null}
                xp={xpAwarded}
                nextHref={nextHref}
              />
            ) : (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Instructions
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)] sm:text-base">
                {storyText}
              </p>
            </div>
            )}
            {targetCircuit && (
              <div className="rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] p-4">
                <h3 className="mb-1 text-sm font-semibold text-[var(--color-brand)]">
                  Target circuit
                </h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {pluralize(targetCircuit.operations.length, "gate")} ·{" "}
                  {pluralize(targetCircuit.qubits.length, "qubit")}
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
        <aside className="learning-panel learning-panel-ops flex min-h-0 flex-col border-b border-[var(--color-border)] lg:border-b-0 lg:border-r">
          <GateLibrary
            variant="learning"
            selectedGate={selectedGate}
            onGateSelect={setSelectedGate}
            onDragStart={setDraggingGate}
            onDragEnd={() => setDraggingGate(null)}
          />
        </aside>

        {/* Circuit canvas — primary focus */}
        <main className="learning-panel learning-panel-canvas min-h-[280px] min-w-0 overflow-hidden bg-[var(--color-canvas)] md:min-h-0">
          <CircuitCanvas
            draggingGate={draggingGate}
            onDragEnd={() => setDraggingGate(null)}
            placementGate={selectedGate}
            onPlacementComplete={() => setSelectedGate(null)}
          />
        </main>

        {/* Code editor — single instance to avoid duplicate Monaco/sync */}
        {isWideLayout ? (
          <aside className="learning-panel learning-panel-code flex min-h-0 flex-col border-l border-[var(--color-border)]">
            <LearningCodePanel
              onExport={handleExportAction}
              onImportSync={handleImportSync}
            />
          </aside>
        ) : null}
      </div>

      {!isWideLayout && (
        <div className="learning-panel-code-mobile max-h-[280px] shrink-0 border-t border-[var(--color-border)]">
          <LearningCodePanel
            onExport={handleExportAction}
            onImportSync={handleImportSync}
          />
        </div>
      )}
      </FeatureErrorBoundary>

      {/* Bottom actions */}
      <div className="shrink-0 space-y-2 border-t border-[var(--color-border)] px-3 py-3 sm:px-4">
        {(mode === "challenge"
          ? feedbackStatus === "success"
          : stage === "done") &&
          nextHref && (
          <NextStepCard
            badge={mode === "lesson" ? "Lesson Complete" : "Challenge Complete"}
            title={mode === "lesson" ? "Ready for the next lesson?" : "Ready for the next challenge?"}
            description="Keep your momentum going — or open this circuit in Build mode to experiment."
            href={nextHref}
            ctaLabel={nextLabel}
            secondaryHref="/progress"
            secondaryLabel="View Progress"
          />
        )}
        <ChallengeFeedback
          status={feedbackStatus}
          message={feedbackMessage}
          quantaMessage={quantaFeedback}
          xpAwarded={xpAwarded}
        />
        <div className="flex flex-wrap gap-2">
          {(!isLesson(activity) || stage === "build") && (
            <Button size="default" className="gap-2" onClick={handleCheck}>
              <CheckCircle className="h-4 w-4" />
              Check Answer
            </Button>
          )}
          <Button size="default" variant="outline" className="gap-2" onClick={() => setShowHint(true)}>
            <Lightbulb className="h-4 w-4" />
            Show Hint
          </Button>
          <Button size="default" variant="ghost" className="gap-2" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          {prevHref && (
            <Button asChild size="default" variant="outline" className="gap-2">
              <Link href={prevHref}>Previous</Link>
            </Button>
          )}
          <Button size="default" variant="outline" className="gap-2" onClick={handleOpenInBuild}>
            Open in Build
          </Button>
          {relatedHref && relatedLabel && (
            <Button asChild size="default" variant="secondary" className="gap-2">
              <Link href={relatedHref}>{relatedLabel}</Link>
            </Button>
          )}
          {(mode === "challenge"
            ? feedbackStatus === "success"
            : stage === "done") &&
            nextHref && (
            <Button
              size="default"
              variant="secondary"
              className="ml-auto gap-2"
              onClick={() => router.push(nextHref)}
            >
              {nextLabel}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function LessonSectionCard({
  lesson,
  index,
  onPrevious,
  onNext,
}: {
  lesson: LessonDefinition;
  index: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const section = lesson.sections[index];
  const miniCircuit = section.circuit;
  return (
    <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
        Part {index + 1} of {lesson.sections.length}
      </p>
      <h2 className="text-lg font-semibold">{section.heading}</h2>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{section.body}</p>
      {miniCircuit && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2 font-mono text-xs">
          {miniCircuit.qubits.map((qubit) => (
            <p key={qubit.id}>
              {qubit.label}:{" "}
              {miniCircuit.operations
                .filter((operation) => operation.targets.includes(qubit.id))
                .concat(
                  miniCircuit.operations.filter((operation) =>
                    operation.controls.includes(qubit.id)
                  )
                )
                .filter((operation, operationIndex, operations) =>
                  operations.findIndex((candidate) => candidate.id === operation.id) === operationIndex
                )
                .sort((a, b) => a.column - b.column)
                .map((operation) =>
                  operation.controls.length
                    ? `${operation.type.toUpperCase()}(${operation.controls.join("→")}→${operation.targets.join(",")})`
                    : operation.type.toUpperCase()
                )
                .join(" → ") || "|0⟩"}
            </p>
          ))}
        </div>
      )}
      <QuantaMessage
        title="Quanta hint"
        message={section.quantaNote ?? lesson.quantaHint}
        variant="hint"
      />
      <div className="flex justify-between gap-2">
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={index === 0}>
          Previous
        </Button>
        <Button size="sm" onClick={onNext}>
          {index === lesson.sections.length - 1 ? "Take the quiz" : "Next"}
        </Button>
      </div>
    </div>
  );
}

function QuizCard({
  lesson,
  index,
  choice,
  checked,
  wrongAttempts,
  onChoice,
  onCheck,
}: {
  lesson: LessonDefinition;
  index: number;
  choice: number | null;
  checked: boolean;
  wrongAttempts: number;
  onChoice: (value: number) => void;
  onCheck: () => void;
}) {
  const question = lesson.quiz[index];
  const correct = choice === question.answerIndex;
  return (
    <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
        Quick check
      </p>
      <h2 className="text-base font-semibold">{question.question}</h2>
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <label
            key={option}
            className={cn(
              "flex cursor-pointer items-start gap-2 rounded border p-2 text-sm",
              checked && choice === index && !correct
                ? "border-[var(--color-destructive)] bg-[var(--color-error-subtle)]"
                : "border-[var(--color-border)]"
            )}
          >
            <input
              type="radio"
              name={`${lesson.id}-quiz`}
              checked={choice === index}
              onChange={() => onChoice(index)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {checked && (
        <p className={correct ? "text-sm text-[var(--color-success)]" : "text-sm text-[var(--color-warning)]"}>
          {correct || wrongAttempts >= 2
            ? question.explanation
            : "Not quite — try another answer."}
        </p>
      )}
      <Button size="sm" onClick={onCheck} disabled={choice === null}>
        {checked ? (correct || wrongAttempts >= 2 ? "Next question" : "Try again") : "Check answer"}
      </Button>
    </div>
  );
}

function DoneCard({
  lesson,
  xp,
  nextHref,
}: {
  lesson: LessonDefinition | null;
  xp: number;
  nextHref?: string;
}) {
  const totalXp = useProgressStore((state) => state.totalXp);
  const level = useProgressStore((state) => state.getLevel());
  const xpInfo = xpForNextLevel(totalXp);
  return (
    <div className="space-y-3">
      <QuantaAchievement
        title="Circuit milestone complete!"
        layout="column"
        message={
          xp === 0
            ? "This lesson was already completed — no extra XP this time. Keep experimenting and Quanta will be here for the next step."
            : `You earned ${xp} XP. Keep experimenting and Quanta will be here for the next step.`
        }
      />
      <div className="space-y-3 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] p-4">
        <h2 className="text-lg font-semibold">Level {level} · {getLevelTitle(level)}</h2>
        <p className="text-sm">
          First-try quizzes add a +10 XP bonus. Your progress is saved automatically.
        </p>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
          <div
            className="h-full rounded-full bg-[var(--color-brand)]"
            style={{ width: `${Math.round((xpInfo.progress || 1) * 100)}%` }}
          />
        </div>
        {lesson?.walkthroughId && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/editor?walkthrough=${lesson.walkthroughId}`}>
              Open guided walkthrough
            </Link>
          </Button>
        )}
        {nextHref && (
          <Button asChild size="sm">
            <Link href={nextHref}>Next lesson</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function LearningCodePanel({
  onExport,
  onImportSync,
}: {
  onExport: (language: CodeLanguageId) => void;
  onImportSync: () => void;
}) {
  return (
    <div className="learning-code-panel flex h-full min-h-0 flex-col">
      <MultiLanguageCodePanel
        active
        onExport={onExport}
        onCodeApplied={onImportSync}
      />
    </div>
  );
}
