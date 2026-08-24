"use client";

import { LESSONS } from "@/lib/learning/lessons";
import {
  MODULE_LABELS,
  MODULE_WHY,
  type ModuleId,
} from "@/lib/learning/progress";
import {
  isLessonUnlockedByOrder,
  useProgressStore,
} from "@/store/progress-store";
import { getNextLesson } from "@/lib/navigation/flow";
import { LessonCard } from "./LessonCard";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

const MODULE_ORDER: ModuleId[] = [
  "quantum-basics",
  "single-qubit-gates",
  "measurement",
  "multi-qubit-gates",
  "entanglement",
  "qiskit",
];

export function LessonPath() {
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const lessonMeta = LESSONS.map((l) => ({ id: l.id, order: l.order }));
  const nextLesson = getNextLesson(completedLessons);

  return (
    <div className="lesson-journey space-y-10">
      {MODULE_ORDER.map((moduleId, moduleIndex) => {
        const moduleLessons = LESSONS.filter((l) => l.module === moduleId).sort(
          (a, b) => a.order - b.order
        );
        if (moduleLessons.length === 0) return null;

        const done = moduleLessons.filter((l) =>
          completedLessons.includes(l.id)
        ).length;
        const progress = done / moduleLessons.length;

        return (
          <section key={moduleId} className="relative">
            {moduleIndex < MODULE_ORDER.length - 1 && (
              <div
                className="lesson-path-line pointer-events-none absolute left-4 top-full hidden h-10 w-px bg-gradient-to-b from-[var(--color-brand)]/40 to-transparent sm:block"
                aria-hidden
              />
            )}
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="mono-label text-[0.7rem] text-[var(--color-brand)]">
                  Module {String(moduleIndex + 1).padStart(2, "0")}
                </p>
                <h2 className="text-base font-semibold text-[var(--color-foreground)]">
                  {MODULE_LABELS[moduleId]}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
                  {MODULE_WHY[moduleId]}
                </p>
              </div>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {done}/{moduleLessons.length} complete
              </span>
            </div>
            <div
              className="academy-progress-bar mb-4 h-2 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${MODULE_LABELS[moduleId]} progress`}
            >
              <div
                className={cn(
                  "h-full rounded-full bg-[var(--color-brand)] transition-[width] duration-500"
                )}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {moduleLessons.map((lesson) => {
                const unlocked = isLessonUnlockedByOrder(
                  lesson.id,
                  lesson.order,
                  completedLessons,
                  lessonMeta
                );
                const prev = lessonMeta.find((l) => l.order === lesson.order - 1);
                const prevLesson = prev
                  ? LESSONS.find((l) => l.id === prev.id)
                  : null;
                return (
                  <Reveal key={lesson.id} delay={(lesson.order % 3) * 60}>
                    <LessonCard
                      lesson={lesson}
                      unlocked={unlocked}
                      completed={completedLessons.includes(lesson.id)}
                      recommended={nextLesson?.id === lesson.id}
                      lockedReason={
                        !unlocked && prevLesson
                          ? `Complete “${prevLesson.title}” first`
                          : undefined
                      }
                    />
                  </Reveal>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
