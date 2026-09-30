import { describe, expect, it } from "vitest";
import { quickActionPositions } from "@/lib/quanta-buddy/quick-actions";

const viewport = { width: 1280, height: 800 };
const size = 32;

describe("quick action positions", () => {
  it("keeps the upper arc inside the viewport and spaces the buttons", () => {
    const positions = quickActionPositions({
      centerX: 640,
      centerY: 500,
      count: 8,
      viewport,
    });

    expect(positions).toHaveLength(8);
    for (const { x, y } of positions) {
      expect(x).toBeGreaterThanOrEqual(8);
      expect(x).toBeLessThanOrEqual(viewport.width - size - 8);
      expect(y).toBeGreaterThanOrEqual(8);
      expect(y).toBeLessThanOrEqual(viewport.height - size - 8);
    }
    for (let first = 0; first < positions.length; first += 1) {
      for (let second = first + 1; second < positions.length; second += 1) {
        const a = positions[first];
        const b = positions[second];
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(size);
      }
    }
    expect(positions[3].y).toBeLessThan(500 - size);
  });

  it("uses the lower arc when the upper arc would cross the top margin", () => {
    const positions = quickActionPositions({
      centerX: 640,
      centerY: 20,
      count: 7,
      viewport,
    });

    expect(positions[3].y).toBeGreaterThan(20);
  });

  it("clamps the ring beside sprites near either horizontal edge", () => {
    const left = quickActionPositions({
      centerX: 20,
      centerY: 400,
      count: 8,
      viewport,
    });
    const right = quickActionPositions({
      centerX: viewport.width - 20,
      centerY: 400,
      count: 8,
      viewport,
    });

    for (const { x, y } of [...left, ...right]) {
      expect(x).toBeGreaterThanOrEqual(8);
      expect(x).toBeLessThanOrEqual(viewport.width - size - 8);
      expect(y).toBeGreaterThanOrEqual(8);
      expect(y).toBeLessThanOrEqual(viewport.height - size - 8);
    }
  });
});
