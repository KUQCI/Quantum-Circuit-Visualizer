"use client";

import type { LessonDefinition } from "@/lib/learning/types";
import { LearningPlayer } from "@/components/learning/LearningPlayer";

export function LessonPlayerClient({
  lesson,
  nextHref,
}: {
  lesson: LessonDefinition;
  nextHref?: string;
}) {
  return (
    <div className="page-container max-w-[1600px] py-4">
      <LearningPlayer
        activity={lesson}
        mode="lesson"
        nextHref={nextHref}
        backHref="/learn"
      />
    </div>
  );
}
