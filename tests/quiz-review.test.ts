import { describe, expect, it } from "vitest";
import { LESSONS } from "@/lib/learning/lessons";
import {
  getDueReviewQuestions,
  getReviewStats,
} from "@/lib/learning/quiz-review";

describe("quiz review scheduling", () => {
  const lessons = LESSONS.slice(0, 2);
  const completed = lessons.map((lesson) => lesson.id);

  it("selects unseen and due questions with deterministic daily ordering", () => {
    const history = {
      [`${lessons[0].id}:${lessons[0].quiz[0].id}`]: {
        box: 2 as const,
        due: "2026-01-10",
        correct: 2,
        wrong: 0,
      },
      [`${lessons[0].id}:${lessons[0].quiz[1].id}`]: {
        box: 1 as const,
        due: "2026-01-12",
        correct: 1,
        wrong: 0,
      },
    };
    const first = getDueReviewQuestions(history, lessons, completed, "2026-01-11");
    const second = getDueReviewQuestions(history, lessons, completed, "2026-01-11");

    expect(first).toEqual(second);
    expect(first).toHaveLength(Math.min(10, lessons.reduce((sum, lesson) => sum + lesson.quiz.length, 0) - 1));
    expect(first).not.toContainEqual(
      expect.objectContaining({ id: lessons[0].quiz[1].id })
    );
  });

  it("reports due, learned, and eligible totals", () => {
    const history = {
      [`${lessons[0].id}:${lessons[0].quiz[0].id}`]: {
        box: 3 as const,
        due: "2026-02-01",
        correct: 3,
        wrong: 0,
      },
      [`${lessons[0].id}:${lessons[0].quiz[1].id}`]: {
        box: 1 as const,
        due: "2026-01-01",
        correct: 1,
        wrong: 0,
      },
    };
    expect(getReviewStats(history, lessons, completed, "2026-01-11")).toEqual({
      due: lessons.reduce((sum, lesson) => sum + lesson.quiz.length, 0) - 2 + 1,
      learned: 1,
      total: lessons.reduce((sum, lesson) => sum + lesson.quiz.length, 0),
    });
  });
});
