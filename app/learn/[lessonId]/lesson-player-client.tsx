"use client";

import type { LessonDefinition } from "@/lib/learning/types";
import { LearningPlayer } from "@/components/learning/LearningPlayer";
import { LockedActivityState } from "@/components/learning/LockedActivityState";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { getLessonBreadcrumbs } from "@/lib/navigation/flow";
import { LESSONS } from "@/lib/learning/lessons";
import { isLessonUnlockedByOrder, useProgressStore } from "@/store/progress-store";

export function LessonPlayerClient({
  lesson,
  nextHref,
  prevHref,
  relatedHref,
  relatedLabel,
}: {
  lesson: LessonDefinition;
  nextHref?: string;
  prevHref?: string;
  relatedHref?: string;
  relatedLabel?: string;
}) {
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const allIds = LESSONS.map((l) => ({ id: l.id, order: l.order }));
  const unlocked = isLessonUnlockedByOrder(
    lesson.id,
    lesson.order,
    completedLessons,
    allIds
  );

  if (!unlocked) {
    return (
      <LockedActivityState
        title={`${lesson.title} is locked`}
        description="Finish earlier lessons in the learning path to unlock this one."
        backHref="/learn"
        backLabel="Back to Learn"
      />
    );
  }

  return (
    <div className="learning-workspace-shell">
      <Breadcrumbs
        items={getLessonBreadcrumbs(lesson)}
        className="mb-2 shrink-0 px-0.5"
      />
      <LearningPlayer
        activity={lesson}
        mode="lesson"
        nextHref={nextHref}
        prevHref={prevHref}
        relatedHref={relatedHref}
        relatedLabel={relatedLabel}
        backHref="/learn"
      />
    </div>
  );
}
