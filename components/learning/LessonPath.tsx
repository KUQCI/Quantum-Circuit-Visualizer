"use client";

import { LESSONS } from "@/lib/learning/lessons";
import { MODULE_LABELS, type ModuleId } from "@/lib/learning/progress";
import {
  isLessonUnlockedByOrder,
  useProgressStore,
} from "@/store/progress-store";
import { LessonCard } from "./LessonCard";

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

  return (
    <div className="space-y-8">
      {MODULE_ORDER.map((moduleId) => {
        const moduleLessons = LESSONS.filter((l) => l.module === moduleId).sort(
          (a, b) => a.order - b.order
        );
        if (moduleLessons.length === 0) return null;

        const done = moduleLessons.filter((l) =>
          completedLessons.includes(l.id)
        ).length;

        return (
          <section key={moduleId}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                {MODULE_LABELS[moduleId]}
              </h2>
              <span className="text-[10px] text-[var(--color-muted-foreground)]">
                {done}/{moduleLessons.length} complete
              </span>
            </div>
            <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {moduleLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  unlocked={isLessonUnlockedByOrder(
                    lesson.id,
                    lesson.order,
                    completedLessons,
                    lessonMeta
                  )}
                  completed={completedLessons.includes(lesson.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
