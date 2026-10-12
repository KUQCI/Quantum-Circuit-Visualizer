"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircuitCanvas } from "@/components/circuit/circuit-canvas";
import { GateLibrary } from "@/components/gates/gate-library";
import { MultiLanguageCodePanel } from "@/components/code/multi-language-code-panel";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { QuantaHint } from "@/components/mascot/QuantaHint";
import { QuantaPopout } from "@/components/mascot/QuantaPopout";
import { ChallengeFeedback } from "@/components/learning/ChallengeFeedback";
import { LessonCircuitPreview } from "@/components/learning/LessonCircuitPreview";
import { LessonWalkthroughPlayer } from "@/components/learning/LessonWalkthroughPlayer";
import { FeatureErrorBoundary } from "@/components/errors/FeatureErrorBoundary";
import { checkCircuit, getLessonGateTypes } from "@/lib/learning/checker";
import type { ChallengeDefinition, LessonDefinition } from "@/lib/learning/types";
import type { CodeLanguageId } from "@/lib/code-adapters";
import { getChallengeBreadcrumbs, getLessonBreadcrumbs } from "@/lib/navigation/flow";
import type { QuantaVariant } from "@/lib/quanta-assets";
import { useCircuitStore } from "@/store/circuit-store";
import { useProgressStore } from "@/store/progress-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { useQuantaPopoutStore } from "@/store/quanta-popout-store";
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

function conditionRequiresCode(
  condition: LessonDefinition["successCondition"]
): boolean {
  if (condition.type === "actionExport" || condition.type === "actionImport") {
    return true;
  }
  if (condition.type === "all" || condition.type === "any") {
    return condition.conditions.some(conditionRequiresCode);
  }
  return false;
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
  const editorUiHydrated = usePersistHydrated(useEditorUiStore.persist);
  const isWideLayout = useMediaQuery("(min-width: 1280px)");
  const isCompact = useMediaQuery(COMPACT_VIEWPORT_QUERY);

  const completeLesson = useProgressStore((s) => s.completeLesson);
  const completeChallenge = useProgressStore((s) => s.completeChallenge);
  const recordQuizResult = useProgressStore((s) => s.recordQuizResult);
  const recordQuizAnswer = useProgressStore((s) => s.recordQuizAnswer);
  const recordSandboxCompleted = useProgressStore((s) => s.recordSandboxCompleted);
  const awardXp = useProgressStore((s) => s.awardXp);
  const recordExport = useProgressStore((s) => s.recordExport);
  const recordImport = useProgressStore((s) => s.recordImport);
  const recordActivity = useProgressStore((s) => s.recordActivity);
  const lessonCodeOpenPreference = useEditorUiStore((s) => s.lessonCodeOpen);
  const setLessonCodeOpenPreference = useEditorUiStore(
    (s) => s.setLessonCodeOpen
  );
  const sayQuanta = useQuantaPopoutStore((s) => s.say);
  const dismissQuanta = useQuantaPopoutStore((s) => s.dismiss);
  const isComplete = useProgressStore((s) =>
    mode === "lesson"
      ? s.isLessonComplete(activity.id)
      : s.isChallengeComplete(activity.id)
  );

  const [draggingGate, setDraggingGate] = useState<string | null>(null);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [quantaPopoutBottomOffset, setQuantaPopoutBottomOffset] = useState<
    number | undefined
  >();
  const actionBarRef = useRef<HTMLDivElement>(null);
  const [lessonPanelOpen, setLessonPanelOpen] = useState(() =>
    typeof window !== "undefined"
      ? !window.matchMedia(COMPACT_VIEWPORT_QUERY).matches
      : true
  );
  const lessonCodeDefaultOpen =
    mode === "lesson" &&
    isLesson(activity) &&
    (conditionRequiresCode(activity.successCondition) ||
      activity.skills.includes("qiskit"));
  const [lessonCodeOpen, setLessonCodeOpen] = useState(
    () => lessonCodeOpenPreference || lessonCodeDefaultOpen
  );

  useEffect(() => {
    setLessonPanelOpen(!isCompact);
  }, [isCompact]);
  useEffect(() => {
    setLessonCodeOpen(
      mode === "lesson"
        ? lessonCodeOpenPreference || lessonCodeDefaultOpen
        : true
    );
  }, [
    activity.id,
    editorUiHydrated,
    lessonCodeDefaultOpen,
    lessonCodeOpenPreference,
    mode,
  ]);

  const toggleLessonCode = () => {
    const next = !lessonCodeOpen;
    setLessonCodeOpen(next);
    setLessonCodeOpenPreference(next);
  };
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
  const sandboxCompletionRef = useRef(false);
  const [maxStageReached, setMaxStageReached] = useState(
    mode === "lesson" ? (isComplete ? 3 : 0) : 2
  );
  const isCompleteRef = useRef(isComplete);
  const modeRef = useRef(mode);

  useLayoutEffect(() => {
    const node = actionBarRef.current;
    if (!node) return;
    let frame = 0;
    const updateOffset = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const { top } = node.getBoundingClientRect();
        setQuantaPopoutBottomOffset(
          Math.max(12, window.innerHeight - top + 12)
        );
      });
    };
    const observer = new ResizeObserver(updateOffset);
    observer.observe(node);
    window.addEventListener("resize", updateOffset);
    window.addEventListener("scroll", updateOffset, { passive: true });
    updateOffset();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOffset);
      window.removeEventListener("scroll", updateOffset);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isCompact]);

  useEffect(() => {
    isCompleteRef.current = isComplete;
  }, [isComplete]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    return () => dismissQuanta();
  }, [activity.id, dismissQuanta]);

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
    sandboxCompletionRef.current = false;
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

  useEffect(() => {
    if (stage !== "learn" || !isLesson(activity)) return;
    const section = activity.sections[sectionIndex];
    if (!section) return;
    const note = section.quantaNote ?? activity.quantaHint;
    setQuantaFeedback(note);
    sayQuanta({
      text: note,
      variant: "hint",
      imageVariant: "learning",
    });
  }, [activity, sayQuanta, sectionIndex, stage]);

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
      recordQuizAnswer(activity.id, question.id, correct);
      if (!correct) {
        setQuizFirstTry(false);
        const attempts = quizWrongAttempts + 1;
        setQuizWrongAttempts(attempts);
        setFeedbackStatus("error");
        setFeedbackMessage("Not quite — try again.");
        const feedback =
          attempts >= 2
            ? `Here's the explanation: ${question.explanation}`
            : activity.quantaIncorrect;
        setQuantaFeedback(feedback);
        sayQuanta({
          text: feedback,
          variant: "error",
          imageVariant: "thinking",
        });
        return;
      }
      setQuantaFeedback(question.explanation);
      sayQuanta({
        text: question.explanation,
        variant: "success",
        imageVariant: "success",
      });
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
          if (activity.id.startsWith("sandbox-")) {
            if (!sandboxCompletionRef.current) {
              awardXp(activity.xpReward, `Complete ${activity.id}`);
              recordSandboxCompleted();
              sandboxCompletionRef.current = true;
              awarded = activity.xpReward;
            }
          } else {
            const didAward = completeChallenge(activity.id, activity.xpReward);
            if (didAward) awarded = activity.xpReward;
          }
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
      sayQuanta({
        text: activity.quantaSuccess,
        variant: "success",
        imageVariant: "success",
      });
    } else {
      setFeedbackStatus("error");
      setFeedbackMessage(result.message);
      setQuantaFeedback(activity.quantaIncorrect);
      sayQuanta({
        text: activity.quantaIncorrect,
        variant: "error",
        imageVariant: "thinking",
      });
    }
  };

  const handleOpenInBuild = () => {
    commitActivityToWorkspace();
    router.push("/editor");
  };

  const nextLabel = mode === "lesson" ? "Next Lesson" : "Next Challenge";
  const panelLabel = mode === "lesson" ? "Guide" : "Briefing";
  const breadcrumbItems = isLesson(activity)
    ? getLessonBreadcrumbs(activity)
    : getChallengeBreadcrumbs(activity);
  const parentBreadcrumb = breadcrumbItems[breadcrumbItems.length - 2];
  const canContinue =
    mode === "challenge"
      ? feedbackStatus === "success"
      : stage === "done";

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
      <div
        className={cn(
          "grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 border-b border-[var(--color-border)] px-3 py-2 sm:px-4 lg:h-14 lg:grid-rows-1 lg:gap-x-3 lg:py-0",
          mode === "lesson" &&
            "lg:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
        )}
      >
        <div className="col-start-1 row-start-1 flex shrink-0 items-center gap-1">
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
        </div>
        <div className="col-start-2 row-start-1 flex min-w-0 items-center gap-1.5">
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 flex-1 items-center gap-1 text-xs text-[var(--color-muted-foreground)]"
          >
            <Link
              href={parentBreadcrumb.href ?? backHref}
              className="hidden max-w-28 shrink-0 truncate hover:text-[var(--color-brand)] sm:inline"
            >
              {parentBreadcrumb.label}
            </Link>
            <ChevronRight className="hidden h-3 w-3 shrink-0 opacity-50 sm:block" aria-hidden />
            <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-[var(--color-foreground)]">
              {activity.title}
            </h1>
          </nav>
          <span className="hidden shrink-0 rounded-full sm:inline border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] capitalize text-[var(--color-muted-foreground)] sm:px-2 sm:text-xs">
            {activity.difficulty}
          </span>
          {isComplete && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] text-[var(--color-success)] sm:px-2 sm:text-xs">
              <CheckCircle className="h-3 w-3" aria-hidden />
              Completed
            </span>
          )}
        </div>
        {mode === "lesson" && (
          <nav
            aria-label="Lesson steps"
            className="col-span-3 row-start-2 flex items-center justify-center gap-1 lg:col-span-1 lg:col-start-3 lg:row-start-1"
          >
            {(["learn", "quiz", "build", "done"] as LessonStage[]).map(
              (item, index) => (
                <div key={item} className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index > maxStageReached}
                    aria-current={stage === item ? "step" : undefined}
                    onClick={() => {
                      setStage(item);
                      setFeedbackStatus("idle");
                      setFeedbackMessage("");
                      setQuantaFeedback("");
                    }}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                      stage === item
                        ? "bg-[var(--color-brand)] text-[var(--color-primary-foreground)]"
                        : index <
                            (["learn", "quiz", "build", "done"] as LessonStage[]).indexOf(
                              stage
                            )
                          ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] hover:underline"
                          : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                    )}
                  >
                    {item}
                  </button>
                  {index < 3 && (
                    <ChevronRight
                      className="h-3 w-3 text-[var(--color-muted-foreground)]"
                      aria-hidden
                    />
                  )}
                </div>
              )
            )}
          </nav>
        )}
        <div
          className={cn(
            "col-start-3 row-start-1 flex min-w-0 items-center justify-end gap-2",
            mode === "lesson" && "lg:col-start-4"
          )}
        >
          {selectedGate && (
            <span className="hidden max-w-48 truncate text-xs text-[var(--color-brand)] sm:inline">
              Tap a wire to place {selectedGate.toUpperCase()}
            </span>
          )}
          <span className="academy-xp-pill text-xs">+{activity.xpReward} XP</span>
        </div>
      </div>
      <QuantaPopout
        bottomOffset={quantaPopoutBottomOffset}
      />

      {/* Main workspace */}
      <FeatureErrorBoundary
        title="Lesson workspace error"
        description="This lesson view hit an unexpected error. You can retry or reset saved browser data."
        resetHref={backHref}
      >
      <div
        className={cn(
          "learning-player-grid min-h-0 flex-1",
          !lessonPanelOpen && "learning-player-grid-lesson-collapsed",
          mode === "lesson" &&
            !lessonCodeOpen &&
            "learning-player-grid-code-collapsed"
        )}
      >
        {/* Lesson / Quanta panel */}
        <aside
          className={cn(
            "learning-panel learning-panel-lesson flex min-h-0 flex-col border-b border-[var(--color-border)] lg:border-b-0 lg:border-r",
            !lessonPanelOpen && "learning-panel-lesson-collapsed"
          )}
          aria-label="Lesson"
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <LearningQuantaMessage
              message={quantaFeedback || activity.quantaIntro}
              variant={
                feedbackStatus === "error"
                  ? "error"
                  : feedbackStatus === "success"
                    ? "success"
                    : "default"
              }
              imageVariant={
                feedbackStatus === "error"
                  ? "thinking"
                  : feedbackStatus === "success"
                    ? "success"
                    : "learning"
              }
            />
            {mode === "lesson" && isLesson(activity) && (
              <LessonWalkthroughPlayer lesson={activity} />
            )}
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
              />
            ) : (
              <div className="space-y-4 border-t border-[var(--color-border)] pt-4">
                <div className="space-y-2">
                  <h2 className="text-base font-semibold">Goal</h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)]">
                    {storyText}
                  </p>
                </div>
                {targetCircuit && (
                  <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
                    <h3 className="text-sm font-semibold text-[var(--color-brand)]">
                      Target circuit
                    </h3>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {pluralize(targetCircuit.operations.length, "gate")} ·{" "}
                      {pluralize(targetCircuit.qubits.length, "qubit")}
                    </p>
                    <ul className="space-y-1 font-mono text-sm">
                      {targetCircuit.operations
                        .sort((a, b) => a.column - b.column)
                        .map((op) => (
                          <li key={op.id}>
                            {op.type.toUpperCase()}{" "}
                            {op.controls.length
                              ? `c=${op.controls.join(",")} `
                              : ""}
                            t={op.targets.join(",")}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <QuantaHint hint={activity.quantaHint} visible={showHint} />
          </div>
        </aside>

        {/* Operations panel */}
        <aside
          className="learning-panel learning-panel-ops flex min-h-0 flex-col border-b border-[var(--color-border)] lg:border-b-0 lg:border-r"
          aria-label="Gate operations"
        >
          <GateLibrary
            variant="learning"
            allowedTypes={
              mode === "lesson" || mode === "challenge"
                ? getLessonGateTypes(
                    activity.successCondition,
                    activity.starterCircuit
                  )
                : undefined
            }
            selectedGate={selectedGate}
            onGateSelect={setSelectedGate}
            onDragStart={setDraggingGate}
            onDragEnd={() => setDraggingGate(null)}
          />
        </aside>

        {/* Circuit canvas — primary focus */}
        <section
          className="learning-panel learning-panel-canvas min-h-[280px] min-w-0 overflow-hidden bg-[var(--color-canvas)] md:min-h-0"
          aria-label="Circuit canvas"
        >
          <CircuitCanvas
            draggingGate={draggingGate}
            onDragEnd={() => setDraggingGate(null)}
            placementGate={selectedGate}
            onPlacementComplete={() => setSelectedGate(null)}
            canvasLabel="Circuit viewport"
            variant="learning"
          />
        </section>

        {/* Code editor — single instance to avoid duplicate Monaco/sync */}
        {isWideLayout ? (
          <aside
            className={cn(
              "learning-panel learning-panel-code flex min-h-0 flex-col border-l border-[var(--color-border)]",
              mode === "lesson" &&
                !lessonCodeOpen &&
                "learning-panel-code-collapsed"
            )}
            aria-label="Code editor"
          >
            {mode === "lesson" ? (
              <LessonCodeDisclosure
                open={lessonCodeOpen}
                onToggle={toggleLessonCode}
                collapsed={!lessonCodeOpen && isWideLayout}
              >
                {lessonCodeOpen && (
                  <LearningCodePanel
                    onExport={handleExportAction}
                    onImportSync={handleImportSync}
                  />
                )}
              </LessonCodeDisclosure>
            ) : (
              <LearningCodePanel
                onExport={handleExportAction}
                onImportSync={handleImportSync}
              />
            )}
          </aside>
        ) : null}
      </div>

      {!isWideLayout && (
        <div
          className={cn(
            "learning-panel-code-mobile max-h-[280px] shrink-0 border-t border-[var(--color-border)]",
            mode === "lesson" &&
              !lessonCodeOpen &&
              "learning-panel-code-mobile-collapsed"
          )}
        >
          {mode === "lesson" ? (
            <LessonCodeDisclosure
              open={lessonCodeOpen}
              onToggle={toggleLessonCode}
            >
              {lessonCodeOpen && (
                <LearningCodePanel
                  onExport={handleExportAction}
                  onImportSync={handleImportSync}
                />
              )}
            </LessonCodeDisclosure>
          ) : (
            <LearningCodePanel
              onExport={handleExportAction}
              onImportSync={handleImportSync}
            />
          )}
        </div>
      )}
      </FeatureErrorBoundary>

      {/* Bottom actions */}
      <div
        ref={actionBarRef}
        className="learning-action-bar shrink-0 border-t border-[var(--color-border)] px-3 py-2 sm:px-4"
      >
        <ChallengeFeedback
          status={feedbackStatus}
          message={feedbackMessage}
          xpAwarded={xpAwarded}
        />
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {canContinue ? (
              <p className="px-1 text-xs text-[var(--color-muted-foreground)]">
                {mode === "lesson" ? "Lesson complete" : "Challenge complete"} ·{" "}
                <Link
                  href="/progress"
                  className="font-medium text-[var(--color-brand)] hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  View progress
                </Link>
              </p>
            ) : (
              (!isLesson(activity) || stage === "build") && (
                <Button size="sm" className="h-9 gap-2" onClick={handleCheck}>
                  <CheckCircle className="h-4 w-4" />
                  Check Answer
                </Button>
              )
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-2"
              onClick={() => {
                setShowHint(true);
                sayQuanta({
                  text: activity.quantaHint,
                  variant: "hint",
                  imageVariant: "thinking",
                });
              }}
            >
              <Lightbulb className="h-4 w-4" />
              Show Hint
            </Button>
            <Button size="sm" variant="ghost" className="h-9 gap-2" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
            {prevHref && (
              <Button asChild size="sm" variant="outline" className="h-9 gap-2">
                <Link href={prevHref}>Previous</Link>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-2"
              onClick={handleOpenInBuild}
            >
              Open in Build
            </Button>
            {relatedHref && relatedLabel && (
              <Button asChild size="sm" variant="secondary" className="h-9 gap-2">
                <Link href={relatedHref}>{relatedLabel}</Link>
              </Button>
            )}
            {canContinue && nextHref && (
              <Button
                asChild
                size="sm"
                className="h-9 gap-2 focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <Link href={nextHref}>
                  {nextLabel}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LearningQuantaMessage({
  message,
  variant,
  imageVariant,
}: {
  message: string;
  variant: "default" | "success" | "hint" | "error";
  imageVariant: QuantaVariant;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 border-l-2 pl-3",
        variant === "error"
          ? "border-[var(--color-destructive)]"
          : variant === "success"
            ? "border-[var(--color-success)]"
            : variant === "hint"
              ? "border-[var(--color-brand)]"
              : "border-[var(--color-border)]"
      )}
      role="status"
    >
      <QuantaImage
        variant={imageVariant}
        size={32}
        bare
        alt="Quanta"
        className="h-8 w-8"
      />
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-sm font-semibold">Quanta</p>
        <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
          {message}
        </p>
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
    <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-brand)]">
        Part {index + 1} of {lesson.sections.length}
      </p>
      <h2 className="text-base font-semibold">{section.heading}</h2>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{section.body}</p>
      {miniCircuit && (
        <LessonCircuitPreview circuit={miniCircuit} />
      )}
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
    <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-brand)]">
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
}: {
  lesson: LessonDefinition | null;
  xp: number;
}) {
  const totalXp = useProgressStore((state) => state.totalXp);
  const level = useProgressStore((state) => state.getLevel());
  const xpInfo = xpForNextLevel(totalXp);
  return (
    <div className="space-y-4 border-t border-[var(--color-border)] pt-4">
      <div className="flex items-start gap-3">
        <QuantaImage
          variant="success"
          size={56}
          bare
          alt="Achievement unlocked"
          className="h-14 w-14"
        />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-brand)]">
            Achievements
          </p>
          <h2 className="text-base font-semibold">Circuit milestone complete!</h2>
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {xp === 0
              ? "This lesson was already completed — no extra XP this time. Keep experimenting and Quanta will be here for the next step."
              : `You earned ${xp} XP. Keep experimenting and Quanta will be here for the next step.`}
          </p>
        </div>
      </div>
      <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
        <p className="text-sm font-semibold">
          Level {level} · {getLevelTitle(level)}
        </p>
        <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
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
      </div>
    </div>
  );
}

function LessonCodeDisclosure({
  open,
  onToggle,
  collapsed = false,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  collapsed?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-h-0 h-full flex-col", collapsed && "w-11")}>
      <button
        type="button"
        className={cn(
          "flex shrink-0 items-center justify-between border-b border-[var(--color-border)] text-left text-sm font-semibold hover:bg-[var(--color-secondary)]",
          collapsed
            ? "h-full w-11 flex-col gap-3 px-0 py-3"
            : "h-10 px-3"
        )}
        onClick={onToggle}
        aria-expanded={open}
        aria-label={collapsed ? "Expand code editor" : undefined}
      >
        <span className={cn(collapsed && "-rotate-90 whitespace-nowrap")}>
          {collapsed ? "Code" : "Code (Qiskit)"}
        </span>
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-90"
          )}
          aria-hidden
        />
      </button>
      {children}
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
