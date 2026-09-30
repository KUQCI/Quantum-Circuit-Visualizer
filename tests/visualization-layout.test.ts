import { describe, expect, it } from "vitest";
import {
  canSplitVizPanels,
  gridClassForCount,
  resolveVizMode,
} from "@/lib/composer-layout";

describe("visualization layout", () => {
  it("keeps the existing split-fit behavior", () => {
    expect(canSplitVizPanels(900, 4)).toBe(true);
    expect(canSplitVizPanels(770, 4)).toBe(false);
    expect(canSplitVizPanels(500, 2)).toBe(true);
  });

  it("uses tabs on mobile regardless of the selected layout", () => {
    expect(
      resolveVizMode({
        forceTabs: false,
        vizLayout: "split",
        tier: "mobile",
        fits: true,
        resizable: false,
        panelCount: 4,
      })
    ).toBe("tabs");
  });

  it("uses a grid for multi view on tablet", () => {
    expect(
      resolveVizMode({
        forceTabs: false,
        vizLayout: "split",
        tier: "tablet",
        fits: true,
        resizable: false,
        panelCount: 2,
      })
    ).toBe("grid");
  });

  it("uses a resizable row for fitting desktop multi view", () => {
    expect(
      resolveVizMode({
        forceTabs: false,
        vizLayout: "split",
        tier: "desktop",
        fits: true,
        resizable: true,
        panelCount: 4,
      })
    ).toBe("row");
  });

  it("uses a grid for narrow desktop multi view", () => {
    expect(
      resolveVizMode({
        forceTabs: false,
        vizLayout: "split",
        tier: "desktop",
        fits: false,
        resizable: true,
        panelCount: 4,
      })
    ).toBe("grid");
  });

  it("uses tabs when the selected layout is tabs", () => {
    expect(
      resolveVizMode({
        forceTabs: false,
        vizLayout: "tabs",
        tier: "desktop",
        fits: true,
        resizable: true,
        panelCount: 4,
      })
    ).toBe("tabs");
  });

  it("uses a single panel mode when only one panel is active", () => {
    expect(
      resolveVizMode({
        forceTabs: true,
        vizLayout: "tabs",
        tier: "desktop",
        fits: true,
        resizable: true,
        panelCount: 1,
      })
    ).toBe("single");
  });

  it("uses count-aware grid classes", () => {
    expect(gridClassForCount(1)).toBe("grid-cols-1");
    expect(gridClassForCount(2)).toBe("grid-cols-2");
    expect(gridClassForCount(3)).toBe("grid-cols-2");
    expect(gridClassForCount(4)).toBe("grid-cols-2");
  });
});
