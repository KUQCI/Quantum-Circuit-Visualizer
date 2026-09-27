import type { LessonDefinition, QuizQuestion } from "@/lib/learning/types";
import type { QuizHistoryEntry } from "@/store/progress-store";

export interface ReviewQuestion extends QuizQuestion {
  lessonId: string;
  lessonTitle: string;
}

function questionKey(lessonId: string, questionId: string): string {
  return `${lessonId}:${questionId}`;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function eligibleQuestions(
  history: Record<string, QuizHistoryEntry>,
  lessons: LessonDefinition[],
  completedLessons: string[]
): ReviewQuestion[] {
  const completed = new Set(completedLessons);
  return lessons.flatMap((lesson) =>
    completed.has(lesson.id)
      ? lesson.quiz.map((question) => ({
          ...question,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
        }))
      : []
  );
}

export function getDueReviewQuestions(
  history: Record<string, QuizHistoryEntry>,
  lessons: LessonDefinition[],
  completedLessons: string[],
  today: string
): ReviewQuestion[] {
  return eligibleQuestions(history, lessons, completedLessons)
    .filter((question) => {
      const entry = history[questionKey(question.lessonId, question.id)];
      return !entry || entry.due <= today;
    })
    .sort((a, b) => {
      const aHash = stableHash(`${today}:${a.lessonId}:${a.id}`);
      const bHash = stableHash(`${today}:${b.lessonId}:${b.id}`);
      return aHash - bHash || a.id.localeCompare(b.id);
    })
    .slice(0, 10);
}

export function getReviewStats(
  history: Record<string, QuizHistoryEntry>,
  lessons: LessonDefinition[],
  completedLessons: string[],
  today: string
): { due: number; learned: number; total: number } {
  const questions = eligibleQuestions(history, lessons, completedLessons);
  let due = 0;
  let learned = 0;
  for (const question of questions) {
    const entry = history[questionKey(question.lessonId, question.id)];
    if (!entry || entry.due <= today) due += 1;
    if (entry?.box === 3) learned += 1;
  }
  return { due, learned, total: questions.length };
}

export function getNextReviewDate(
  history: Record<string, QuizHistoryEntry>,
  lessons: LessonDefinition[],
  completedLessons: string[],
  today: string
): string | null {
  const dates = eligibleQuestions(history, lessons, completedLessons)
    .map((question) => history[questionKey(question.lessonId, question.id)]?.due)
    .filter((due): due is string => Boolean(due && due > today))
    .sort();
  return dates[0] ?? null;
}
