"use client";

import type { LessonDefinition } from "@/lib/learning/types";
import { LearningPlayer } from "@/components/learning/LearningPlayer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { getLessonBreadcrumbs } from "@/lib/navigation/flow";

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
