import { describe, expect, it } from "vitest";
import {
  HoverIntent,
  quickActionLabelPlacement,
  quickActionPositions,
} from "@/lib/quanta-buddy/quick-actions";

const viewport = { width: 1280, height: 800 };
const size = 32;

describe("quick action positions", () => {
  it("keeps the upper arc inside the viewport and spaces the buttons", () => {
    const positions = quickActionPositions({
      centerX: 640,
      centerY: 500,
      count: 9,
      viewport,
    });

    expect(positions).toHaveLength(9);
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

describe("quick action label placement", () => {
  it("places the top-of-arc label above and centered", () => {
    expect(
      quickActionLabelPlacement({
        x: 624,
        y: 300,
        centerX: 640,
        centerY: 500,
        viewportWidth: 1280,
      })
    ).toEqual({ side: "above", align: "center" });
  });

  it("places a rightmost endpoint label to the right", () => {
    expect(
      quickActionLabelPlacement({
        x: 760,
        y: 480,
        centerX: 640,
        centerY: 500,
        viewportWidth: 1280,
      })
    ).toEqual({ side: "right", align: "center" });
  });

  it("flips a left endpoint label right when it would cross the viewport edge", () => {
    expect(
      quickActionLabelPlacement({
        x: 10,
        y: 384,
        centerX: 100,
        centerY: 400,
        viewportWidth: 1280,
      })
    ).toEqual({ side: "right", align: "center" });
  });

  it("aligns an above label to the end near the right viewport edge", () => {
    expect(
      quickActionLabelPlacement({
        x: 1210,
        y: 300,
        centerX: 1200,
        centerY: 500,
        viewportWidth: 1280,
      })
    ).toEqual({ side: "above", align: "end" });
  });

  it("places a lower-arc label below and centered", () => {
    expect(
      quickActionLabelPlacement({
        x: 624,
        y: 100,
        centerX: 640,
        centerY: 20,
        viewportWidth: 1280,
      })
    ).toEqual({ side: "below", align: "center" });
  });
});

describe("HoverIntent", () => {
  const hovering = {
    overBuddy: true,
    overRing: false,
    canOpen: true,
    open: false,
  };

  it("opens after 250ms of continuous hover", () => {
    const intent = new HoverIntent();

    expect(intent.update(0, hovering)).toBeNull();
    expect(intent.update(249, hovering)).toBeNull();
    expect(intent.update(250, hovering)).toBe("open");
  });

  it("does not open after a brief hover", () => {
    const intent = new HoverIntent();

    expect(intent.update(0, hovering)).toBeNull();
    expect(intent.update(200, { ...hovering, overBuddy: false })).toBeNull();
    expect(intent.update(201, hovering)).toBeNull();
    expect(intent.update(450, hovering)).toBeNull();
    expect(intent.update(451, hovering)).toBe("open");
  });

  it("closes 1200ms after leaving the buddy and ring", () => {
    const intent = new HoverIntent();
    const outside = {
      overBuddy: false,
      overRing: false,
      canOpen: false,
      open: true,
    };

    expect(intent.update(0, outside)).toBeNull();
    expect(intent.update(1199, outside)).toBeNull();
    expect(intent.update(1200, outside)).toBe("close");
  });

  it("cancels closing when the pointer enters a ring button", () => {
    const intent = new HoverIntent();
    const outside = {
      overBuddy: false,
      overRing: false,
      canOpen: false,
      open: true,
    };

    expect(intent.update(0, outside)).toBeNull();
    expect(
      intent.update(1100, { ...outside, overRing: true })
    ).toBeNull();
    expect(intent.update(1200, outside)).toBeNull();
    expect(intent.update(2399, outside)).toBeNull();
    expect(intent.update(2400, outside)).toBe("close");
  });

  it("blocks opening while the buddy cannot open", () => {
    const intent = new HoverIntent();
    const blocked = { ...hovering, canOpen: false };

    expect(intent.update(0, blocked)).toBeNull();
    expect(intent.update(250, blocked)).toBeNull();
    expect(intent.update(251, hovering)).toBeNull();
    expect(intent.update(501, hovering)).toBe("open");
  });

  it("requires a fresh continuous hover after reset", () => {
    const intent = new HoverIntent();

    expect(intent.update(0, hovering)).toBeNull();
    expect(intent.update(200, hovering)).toBeNull();
    intent.reset();
    expect(intent.update(449, hovering)).toBeNull();
    expect(intent.update(698, hovering)).toBeNull();
    expect(intent.update(699, hovering)).toBe("open");
  });
});
