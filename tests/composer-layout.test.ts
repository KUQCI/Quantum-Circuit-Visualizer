import { describe, expect, it } from "vitest";
import { computeComposerLayout, getLayoutTier } from "@/lib/composer-layout";

describe("composer-layout", () => {
  it("classifies tiers from width and height", () => {
    expect(getLayoutTier(390, 844)).toBe("mobile");
    expect(getLayoutTier(800, 700)).toBe("tablet");
    expect(getLayoutTier(1440, 900)).toBe("desktop");
    expect(getLayoutTier(1200, 500)).toBe("mobile");
  });

  it("fits top and viz bands inside measured workspace height", () => {
    const layout = computeComposerLayout({
      width: 1440,
      height: 720,
      showVizPanels: true,
    });

    expect(layout.topHeightPx + layout.vizHeightPx).toBe(720);
    expect(layout.vizHeightPx).toBeGreaterThanOrEqual(188);
    expect(layout.topHeightPx).toBeGreaterThanOrEqual(280);
    expect(layout.useVizTabs).toBe(false);
  });

  it("allocates full height to top row when viz is hidden", () => {
    const layout = computeComposerLayout({
      width: 1280,
      height: 600,
      showVizPanels: false,
    });

    expect(layout.topHeightPx).toBe(600);
    expect(layout.vizHeightPx).toBe(0);
  });

  it("uses tabs and overlays on tablet", () => {
    const layout = computeComposerLayout({
      width: 900,
      height: 700,
      showVizPanels: true,
    });

    expect(layout.tier).toBe("tablet");
    expect(layout.useVizTabs).toBe(true);
    expect(layout.useOverlayPanels).toBe(true);
    expect(layout.topHeightPx + layout.vizHeightPx).toBe(700);
  });
});
