export interface QuickActionViewport {
  width: number;
  height: number;
}

export interface QuickActionPositionInput {
  centerX: number;
  centerY: number;
  count: number;
  viewport: QuickActionViewport;
  radius?: number;
  size?: number;
}

export interface QuickActionPosition {
  x: number;
  y: number;
}

export interface HoverIntentState {
  overBuddy: boolean;
  overRing: boolean;
  canOpen: boolean;
  open: boolean;
}

export class HoverIntent {
  private openStartedAt: number | null = null;
  private closeStartedAt: number | null = null;
  private readonly openDelay: number;
  private readonly closeDelay: number;

  constructor({
    openDelay = 250,
    closeDelay = 1200,
  }: {
    openDelay?: number;
    closeDelay?: number;
  } = {}) {
    this.openDelay = openDelay;
    this.closeDelay = closeDelay;
  }

  update(
    now: number,
    state: HoverIntentState
  ): "open" | "close" | null {
    if (!state.open) {
      this.closeStartedAt = null;
      if (!state.overBuddy || !state.canOpen) {
        this.openStartedAt = null;
        return null;
      }
      if (this.openStartedAt === null) {
        this.openStartedAt = now;
        return null;
      }
      if (now - this.openStartedAt >= this.openDelay) {
        this.openStartedAt = null;
        return "open";
      }
      return null;
    }

    this.openStartedAt = null;
    if (state.overBuddy || state.overRing) {
      this.closeStartedAt = null;
      return null;
    }
    if (this.closeStartedAt === null) {
      this.closeStartedAt = now;
      return null;
    }
    return now - this.closeStartedAt >= this.closeDelay ? "close" : null;
  }

  reset(): void {
    this.openStartedAt = null;
    this.closeStartedAt = null;
  }
}

export function quickActionPositions({
  centerX,
  centerY,
  count,
  viewport,
  radius = 92,
  size = 32,
}: QuickActionPositionInput): QuickActionPosition[] {
  if (count <= 0) return [];

  const angles = Array.from({ length: count }, (_, index) =>
    count === 1 ? 90 : 200 - (220 * index) / (count - 1)
  );
  const makePositions = (lowerArc: boolean) =>
    angles.map((angle) => {
      const radians = (angle * Math.PI) / 180;
      return {
        x: centerX + radius * Math.cos(radians) - size / 2,
        y:
          centerY +
          (lowerArc ? radius * Math.sin(radians) : -radius * Math.sin(radians)) -
          size / 2,
      };
    });

  let positions = makePositions(false);
  if (positions.some((position) => position.y < 8)) {
    positions = makePositions(true);
  }

  const maxX = Math.max(8, viewport.width - size - 8);
  const maxY = Math.max(8, viewport.height - size - 8);
  return positions.map(({ x, y }) => ({
    x: Math.min(maxX, Math.max(8, x)),
    y: Math.min(maxY, Math.max(8, y)),
  }));
}
