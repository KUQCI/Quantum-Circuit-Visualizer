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
  if (width < 640 || height < 520) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

/**
 * Compute IBM Composer–style panel sizes from the measured workspace box
 * (area between composer toolbar and footer).
 */
export function computeComposerLayout(input: ComposerLayoutInput): ComposerLayout {
  const { width, height, showVizPanels } = input;
  const tier = getLayoutTier(width, height);
  const useOverlayPanels = tier !== "desktop";
  const useVizTabs = tier !== "desktop";

  const opsPanelWidthPx =
    tier === "desktop"
      ? clamp(Math.round(width * 0.13), 212, 252)
      : clamp(Math.round(width * 0.88), 240, 320);

  const codePanelWidthPx =
    tier === "desktop"
      ? clamp(Math.round(width * 0.21), 280, 360)
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

  const vizRatio = tier === "mobile" ? 0.44 : tier === "tablet" ? 0.4 : 0.38;
  const minViz = tier === "mobile" ? 148 : tier === "tablet" ? 168 : 188;
  const maxViz =
    tier === "desktop"
      ? clamp(Math.round(height * 0.46), 220, 440)
      : clamp(Math.round(height * 0.48), 160, 320);

  let vizHeightPx = clamp(Math.round(height * vizRatio), minViz, maxViz);

  // On very short workspaces, cap viz so the circuit row stays usable.
  const minTop = tier === "mobile" ? 200 : tier === "tablet" ? 240 : 280;
  if (height - vizHeightPx < minTop) {
    vizHeightPx = Math.max(minViz, height - minTop);
  }

  const topHeightPx = Math.max(0, height - vizHeightPx);

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
