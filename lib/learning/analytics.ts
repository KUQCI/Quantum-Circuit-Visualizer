import type { LessonDefinition, QuizQuestion } from "@/lib/learning/types";
import {
  MODULE_IDS,
  MODULE_LABELS,
  xpForNextLevel,
  type ModuleId,
} from "@/lib/learning/progress";

export interface ModuleMastery {
  moduleId: ModuleId;
  title: string;
  lessonsDone: number;
  lessonsTotal: number;
  quizAccuracy: number | null;
  mastery: number;
}

export interface WeakestTopic {
  lessonId: string;
  lessonTitle: string;
  questionId: string;
  question: string;
  wrong: number;
  correct: number;
  box: 0 | 1 | 2;
}

export interface LevelProjection {
  xpToNext: number;
  nextLevel: number | null;
  estDays: number | null;
}

export interface QuizHistoryLike {
  box: number;
  correct: number;
  wrong: number;
}

type AnalyticsLesson = Pick<
  LessonDefinition,
  "id" | "title" | "module" | "quiz"
>;

function getQuizStats(
  questions: readonly QuizQuestion[],
  quizHistory: Record<string, QuizHistoryLike>,
  lessonId: string
): { correct: number; wrong: number } {
  return questions.reduce(
    (stats, question) => {
      const history = quizHistory[`${lessonId}:${question.id}`];
      if (!history) return stats;
      return {
        correct: stats.correct + Math.max(0, history.correct),
        wrong: stats.wrong + Math.max(0, history.wrong),
      };
    },
    { correct: 0, wrong: 0 }
  );
}

export function getModuleMastery(
  lessons: readonly AnalyticsLesson[],
  completedLessons: readonly string[],
  quizHistory: Record<string, QuizHistoryLike>
): ModuleMastery[] {
  const completed = new Set(completedLessons);

  return MODULE_IDS.map((moduleId) => {
    const moduleLessons = lessons.filter((lesson) => lesson.module === moduleId);
    const lessonsDone = moduleLessons.filter((lesson) =>
      completed.has(lesson.id)
    ).length;
    const lessonShare =
      moduleLessons.length > 0 ? lessonsDone / moduleLessons.length : 0;
    const stats = moduleLessons.reduce(
      (total, lesson) => {
        const current = getQuizStats(lesson.quiz, quizHistory, lesson.id);
        return {
          correct: total.correct + current.correct,
          wrong: total.wrong + current.wrong,
        };
      },
      { correct: 0, wrong: 0 }
    );
    const answered = stats.correct + stats.wrong;
    const quizAccuracy = answered > 0 ? stats.correct / answered : null;
    const mastery =
      quizAccuracy === null
        ? lessonShare
        : 0.6 * lessonShare + 0.4 * quizAccuracy;

    return {
      moduleId,
      title: MODULE_LABELS[moduleId],
      lessonsDone,
      lessonsTotal: moduleLessons.length,
      quizAccuracy,
      mastery: Math.max(0, Math.min(1, mastery)),
    };
  });
}

export function getWeakestTopics(
  lessons: readonly AnalyticsLesson[],
  quizHistory: Record<string, QuizHistoryLike>,
  limit = 3
): WeakestTopic[] {
  const topics: Array<WeakestTopic & { accuracy: number }> = [];

  for (const lesson of lessons) {
    for (const question of lesson.quiz) {
      const history = quizHistory[`${lesson.id}:${question.id}`];
      if (!history || history.wrong < 1 || history.box >= 3) continue;
      const correct = Math.max(0, history.correct);
      const wrong = Math.max(0, history.wrong);
      topics.push({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        questionId: question.id,
        question: question.question,
        wrong,
        correct,
        box: Math.max(0, Math.min(2, Math.round(history.box))) as 0 | 1 | 2,
        accuracy: correct / Math.max(1, correct + wrong),
      });
    }
  }

  return topics
    .sort(
      (a, b) =>
        a.box - b.box ||
        b.wrong - a.wrong ||
        a.accuracy - b.accuracy ||
        a.lessonId.localeCompare(b.lessonId) ||
        a.questionId.localeCompare(b.questionId)
    )
    .slice(0, Math.max(0, limit))
    .map((topic) => ({
      lessonId: topic.lessonId,
      lessonTitle: topic.lessonTitle,
      questionId: topic.questionId,
      question: topic.question,
      wrong: topic.wrong,
      correct: topic.correct,
      box: topic.box,
    }));
}

function averageDailyXp(
  history: Record<string, number> | readonly number[]
): number | null {
  const rawValues = Array.isArray(history)
    ? history
    : Object.entries(history)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7)
        .map(([, value]) => value);
  const values = rawValues
    .filter((value) => Number.isFinite(value) && value >= 0)
    .map((value) => Number(value));
  if (values.length === 0) return null;
  if (values.length === 1) return Math.max(values[0]!, 50);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getLevelProjection(
  xp: number,
  xpHistoryLast7Days?: Record<string, number> | readonly number[]
): LevelProjection {
  const info = xpForNextLevel(Math.max(0, xp));
  if (!info.nextLevel) {
    return { xpToNext: 0, nextLevel: null, estDays: null };
  }

  const xpToNext = Math.max(0, info.xpNeeded - info.xpIntoLevel);
  const average = xpHistoryLast7Days
    ? averageDailyXp(xpHistoryLast7Days)
    : null;
  return {
    xpToNext,
    nextLevel: info.nextLevel,
    estDays:
      average && average > 0 ? Math.ceil(xpToNext / average) : null,
  };
}
