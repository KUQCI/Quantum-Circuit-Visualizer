import { LESSONS, LESSON_IDS, getLessonById } from "@/lib/learning/lessons";
import { LessonPlayerClient } from "./lesson-player-client";

export function generateStaticParams() {
  return LESSON_IDS.map((lessonId) => ({ lessonId }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);

  if (!lesson) {
    return (
      <div className="page-container py-12 text-center">
        <p>Lesson not found.</p>
      </div>
    );
  }

  const idx = LESSONS.findIndex((l) => l.id === lessonId);
  const nextLesson = idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null;

  return (
    <LessonPlayerClient
      lesson={lesson}
      nextHref={nextLesson ? `/learn/${nextLesson.id}` : undefined}
    />
  );
}
