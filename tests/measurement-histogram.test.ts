import { describe, expect, it } from "vitest";
import { histogramAxisMax } from "@/components/visualizations/measurement-histogram";

describe("histogramAxisMax", () => {
  it.each([
    [40.3, 50],
    [100, 100],
    [0, 25],
    [76, 100],
  ])("uses a shared nice axis scale for %s%%", (maxPct, expected) => {
    expect(histogramAxisMax(maxPct)).toBe(expected);
  });
});
