export type LayoutTier = "mobile" | "tablet" | "desktop";

export interface ComposerLayoutInput {
  width: number;
  height: number;
  showVizPanels: boolean;
}

export interface ComposerLayout {
  tier: LayoutTier;
  topHeightPx: number;
  vizHeightPx: number;
  opsPanelWidthPx: number;
  codePanelWidthPx: number;
  useVizTabs: boolean;
  useOverlayPanels: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getLayoutTier(width: number, height: number): LayoutTier {
  if (width < 640 || height < 480) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

/**
 * Split measured workspace height between circuit row and viz band.
 * Always returns top + viz === height (no page overflow).
 */
export function computeComposerLayout(input: ComposerLayoutInput): ComposerLayout {
  const { width, height, showVizPanels } = input;
  const tier = getLayoutTier(width, height);
  const useOverlayPanels = tier !== "desktop";
  const useVizTabs = tier !== "desktop";

  const opsPanelWidthPx =
    tier === "desktop"
      ? clamp(Math.round(width * 0.13), 200, 248)
      : clamp(Math.round(width * 0.88), 240, 320);

  const codePanelWidthPx =
    tier === "desktop"
      ? clamp(Math.round(width * 0.21), 272, 352)
      : clamp(Math.round(width * 0.92), 280, 380);

  if (!showVizPanels || height <= 0) {
    return {
      tier,
      topHeightPx: Math.max(height, 0),
      vizHeightPx: 0,
      opsPanelWidthPx,
      codePanelWidthPx,
      useVizTabs,
      useOverlayPanels,
    };
  }

  const vizRatio = tier === "mobile" ? 0.4 : tier === "tablet" ? 0.38 : 0.36;
  const minTop =
    tier === "mobile" ? 140 : tier === "tablet" ? 160 : 180;
  const minViz =
    tier === "mobile" ? 120 : tier === "tablet" ? 140 : 160;

  const maxViz = Math.max(0, height - minTop);
  let vizHeightPx = Math.round(height * vizRatio);
  vizHeightPx = clamp(vizHeightPx, 0, maxViz);

  if (maxViz >= minViz) {
    vizHeightPx = clamp(vizHeightPx, minViz, maxViz);
  } else {
    vizHeightPx = maxViz;
  }

  const topHeightPx = height - vizHeightPx;

  return {
    tier,
    topHeightPx,
    vizHeightPx,
    opsPanelWidthPx,
    codePanelWidthPx,
    useVizTabs,
    useOverlayPanels,
  };
}
