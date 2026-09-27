import { describe, expect, it } from "vitest";
import { getTourSteps } from "@/lib/learning/build-tour";

describe("Build tour steps", () => {
  it("returns the five desktop anchors in order", () => {
    expect(getTourSteps("desktop").map((step) => step.id)).toEqual([
      "gates",
      "canvas",
      "inspector",
      "code",
      "run",
    ]);
    expect(getTourSteps("desktop").every((step) => !step.narrowTab)).toBe(true);
  });

  it("maps panel steps to narrow tabs", () => {
    expect(getTourSteps("mobile").map((step) => step.narrowTab)).toEqual([
      "gates",
      undefined,
      "inspector",
      "code",
      undefined,
    ]);
  });
});
