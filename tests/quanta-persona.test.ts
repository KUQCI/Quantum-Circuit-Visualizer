import { describe, expect, it } from "vitest";
import {
  greetingFor,
  levelUpLine,
  pageHelpFor,
  runErrorReaction,
  runReactionFor,
  tipsFor,
  type PersonaContext,
  wakeLine,
} from "@/lib/quanta-buddy/persona";

const context: PersonaContext = {
  path: "/",
  level: 2,
  levelTitle: "Hatchling",
  streak: 3,
  completedLessons: 2,
  xpToNext: 50,
  firstVisit: false,
};

describe("Quanta persona", () => {
  it("builds a level-up line with optional wardrobe unlocks", () => {
    expect(levelUpLine(5, [])).toBe(
      "Level 5 — Superposition Scholar! I grew up a little."
    );
    expect(
      levelUpLine(5, ["Graduation cap"]).endsWith(
        " New in my wardrobe: Graduation cap. Hover over me → Wardrobe."
      )
    ).toBe(true);
    expect(levelUpLine(12, ["Crown", "Golden"])).toContain("Crown, Golden");
  });

  it("greets a first-time visitor on Home", () => {
    expect(
      greetingFor({ ...context, firstVisit: true, streak: 0, completedLessons: 0 })
    ).toMatchObject({
      text: expect.stringContaining("Hi, I'm Quanta!"),
    });
  });

  it("greets returning visitors with progress context", () => {
    expect(greetingFor(context)?.text).toContain("Hatchling");
    expect(greetingFor({ ...context, streak: 0 })?.text).toContain("2 lessons");
  });

  it("does not duplicate lesson-player greetings", () => {
    expect(greetingFor({ ...context, path: "/learn/what-is-a-qubit" })).toBeNull();
    expect(greetingFor({ ...context, path: "/challenges/superposition-sprint" })).toBeNull();
  });

  it("provides tips for the main pages", () => {
    expect(tipsFor("/editor")).not.toHaveLength(0);
    expect(tipsFor("/learn")).not.toHaveLength(0);
    expect(tipsFor("/")).not.toHaveLength(0);
  });

  it("provides help copy for every supported page", () => {
    for (const path of [
      "/",
      "/editor",
      "/learn",
      "/challenges",
      "/progress",
      "/achievements",
      "/projects",
      "/import",
      "/export",
      "/review",
      "/docs/mascot",
      "/roadmap",
    ]) {
      expect(pageHelpFor(path)).not.toHaveLength(0);
    }
  });

  it("normalizes trailing slashes", () => {
    expect(greetingFor({ ...context, path: "/editor/" })).toEqual(
      greetingFor({ ...context, path: "/editor" })
    );
    expect(tipsFor("/learn/")).toEqual(tipsFor("/learn"));
  });

  it("describes deterministic, spread, and dominant runs", () => {
    expect(
      runReactionFor({ shots: 1025, histogram: [{ count: 1025 }] })
    ).toContain("1025 shots");
    expect(
      runReactionFor({
        shots: 100,
        histogram: [{ count: 50 }, { count: 50 }],
      })
    ).toContain("2 outcomes");
    expect(
      runReactionFor({
        shots: 100,
        histogram: [{ count: 80 }, { count: 20 }],
      })
    ).toContain("80%");
  });

  it("reacts to short and long run errors", () => {
    expect(runErrorReaction("Missing parameter")).toContain(
      "Missing parameter Quack."
    );
    expect(runErrorReaction("x".repeat(80))).toBe(
      "That circuit didn't run. Check the panel message, then try again — quack."
    );
  });

  it("returns a wake line", () => {
    expect(wakeLine()).not.toHaveLength(0);
  });
});
