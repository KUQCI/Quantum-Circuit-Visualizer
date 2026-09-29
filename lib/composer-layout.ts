export type LayoutTier = "mobile" | "tablet" | "desktop";
export type NarrowPanelTab = "gates" | "inspector" | "results" | "code";

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

export function shouldAutoOpenNarrowInspector(
  previousSelectedOperationId: string | null,
  selectedOperationId: string | null,
  activeTab: NarrowPanelTab
): boolean {
  return (
    selectedOperationId !== null &&
    selectedOperationId !== previousSelectedOperationId &&
    activeTab !== "inspector"
  );
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

export const VIZ_BAND_MIN_PX = 220;
export const VIZ_SPLIT_MIN_PANEL_PX = 220;

/**
 * Minimum viz band size as a percentage of the vertical workspace so the
 * results band never shrinks below VIZ_BAND_MIN_PX on short viewports.
 */
export function getVizBandMinPercent(workspaceHeight: number): number {
  if (workspaceHeight <= 0) return 16;
  const pct = Math.ceil((VIZ_BAND_MIN_PX / workspaceHeight) * 100);
  return clamp(pct, 16, 60);
}

export type VizMode = "tabs" | "row" | "grid" | "single";

export interface ResolveVizModeInput {
  forceTabs: boolean;
  vizLayout: "tabs" | "split";
  tier: LayoutTier;
  fits: boolean;
  resizable: boolean;
  panelCount: number;
}

export function resolveVizMode({
  forceTabs,
  vizLayout,
  tier,
  fits,
  resizable,
  panelCount,
}: ResolveVizModeInput): VizMode {
  if (panelCount <= 1) return "single";
  if (forceTabs || tier === "mobile" || vizLayout === "tabs") return "tabs";
  if (tier === "desktop" && fits && resizable) return "row";
  return "grid";
}

export function gridClassForCount(count: number): string {
  if (count === 2) return "grid-cols-2 grid-rows-1";
  if (count === 3 || count === 4) return "grid-cols-2 grid-rows-2";
  return "grid-cols-1";
}

/** Whether `panelCount` result panels fit side by side in `width` px. */
export function canSplitVizPanels(width: number, panelCount: number): boolean {
  if (width <= 0 || panelCount <= 1) return true;
  return width / panelCount >= VIZ_SPLIT_MIN_PANEL_PX;
}
