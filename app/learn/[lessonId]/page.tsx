import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LESSON_IDS, getLessonById } from "@/lib/learning/lessons";
import {
  getNextLessonById,
  getPrevLesson,
  getRelatedChallenge,
} from "@/lib/navigation/flow";
import { LessonPlayerClient } from "./lesson-player-client";

export function generateStaticParams() {
  return LESSON_IDS.map((lessonId) => ({ lessonId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);

  if (!lesson) {
    return {
      title: "Lesson not found | Quantum Circuit Visualizer",
    };
  }

  return {
    title: `${lesson.title} | Quantum Circuit Visualizer`,
    description: lesson.description,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  const nextLesson = getNextLessonById(lessonId);
  const prevLesson = getPrevLesson(lessonId);
  const relatedChallenge = getRelatedChallenge(lessonId);

  return (
    <LessonPlayerClient
      lesson={lesson}
      nextHref={nextLesson ? `/learn/${nextLesson.id}` : undefined}
      prevHref={prevLesson ? `/learn/${prevLesson.id}` : undefined}
      relatedHref={
        relatedChallenge ? `/challenges/${relatedChallenge.id}` : undefined
      }
      relatedLabel={
        relatedChallenge ? `Try ${relatedChallenge.title}` : undefined
      }
    />
  );
}
