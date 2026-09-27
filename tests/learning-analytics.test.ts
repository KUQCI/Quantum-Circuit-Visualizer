import { describe, expect, it } from "vitest";
import { LESSONS } from "@/lib/learning/lessons";
import {
  getLevelProjection,
  getModuleMastery,
  getWeakestTopics,
} from "@/lib/learning/analytics";

describe("learner analytics", () => {
  it("calculates module mastery from lessons and quiz accuracy", () => {
    const lessons = [
      LESSONS.find((lesson) => lesson.module === "quantum-basics")!,
      LESSONS.find((lesson) => lesson.module === "measurement")!,
    ];
    const completed = lessons.slice(0, 1).map((lesson) => lesson.id);
    const quiz = lessons[0]!.quiz[0]!;

    const [basics] = getModuleMastery(lessons, completed, {
      [`${lessons[0]!.id}:${quiz.id}`]: {
        box: 1,
        correct: 3,
        wrong: 1,
      },
    });

    expect(basics).toMatchObject({
      moduleId: "quantum-basics",
      lessonsDone: 1,
      lessonsTotal: 1,
      quizAccuracy: 0.75,
    });
    expect(basics!.mastery).toBeCloseTo(0.9);
  });

  it("returns all module rows and falls back to lesson share without quiz history", () => {
    const mastery = getModuleMastery(LESSONS, [], {});
    expect(mastery).toHaveLength(9);
    expect(mastery.every((module) => module.mastery === 0)).toBe(true);
    expect(mastery.map((module) => module.title)).toContain("Measurement");
  });

  it("prioritizes weak questions by box, misses, and accuracy", () => {
    const first = LESSONS.find((lesson) => lesson.quiz.length > 0)!;
    const second = LESSONS.find(
      (lesson) => lesson.quiz.length > 0 && lesson.id !== first.id
    )!;
    const firstQuestion = first.quiz[0]!;
    const secondQuestion = second.quiz[0]!;
    const topics = getWeakestTopics(
      [first, second],
      {
        [`${first.id}:${firstQuestion.id}`]: {
          box: 1,
          correct: 1,
          wrong: 3,
        },
        [`${second.id}:${secondQuestion.id}`]: {
          box: 0,
          correct: 4,
          wrong: 1,
        },
        [`${second.id}:${second.quiz[1]?.id ?? secondQuestion.id}`]: {
          box: 3,
          correct: 0,
          wrong: 4,
        },
      },
      2
    );

    expect(topics).toHaveLength(2);
    expect(topics[0]).toMatchObject({
      lessonId: second.id,
      questionId: secondQuestion.id,
      box: 0,
    });
    expect(topics.map((topic) => topic.questionId)).not.toContain(
      second.quiz[1]?.id
    );
  });

  it("projects days from recent XP and uses a lesson-sized floor today", () => {
    expect(getLevelProjection(150, [10])).toEqual({
      xpToNext: 100,
      nextLevel: 3,
      estDays: 2,
    });
    expect(getLevelProjection(150, [25, 75]).estDays).toBe(2);
    expect(getLevelProjection(900, [50])).toMatchObject({
      xpToNext: 500,
      nextLevel: 6,
      estDays: 10,
    });
    expect(getLevelProjection(8500, [100])).toEqual({
      xpToNext: 0,
      nextLevel: null,
      estDays: null,
    });
  });
});
