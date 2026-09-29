import { describe, expect, it } from "vitest";
import {
  QuantaBuddyEngine,
  type BuddyRng,
  type BuddyViewport,
} from "@/lib/quanta-buddy/engine";

class SequenceRng implements BuddyRng {
  private index = 0;

  constructor(private readonly values: number[]) {}

  next(): number {
    const value = this.values[this.index] ?? this.values.at(-1) ?? 0;
    this.index += 1;
    return value;
  }
}

const viewport: BuddyViewport = { width: 800, height: 600 };

function tickUntil(
  engine: QuantaBuddyEngine,
  predicate: (frame: ReturnType<QuantaBuddyEngine["tick"]>) => boolean,
  max = 5000
) {
  let frame = engine.tick(0);
  for (let index = 1; index <= max && !predicate(frame); index += 1) {
    frame = engine.tick(index * 16);
  }
  return frame;
}

describe("QuantaBuddyEngine", () => {
  it("lands after a falling entrance and begins recovery", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      rng: new SequenceRng([0.1, 0.9, 0.1, 0.1]),
    });

    engine.call();
    const frame = tickUntil(
      engine,
      (next) => next.y === viewport.height - 128
    );

    expect(frame.y).toBe(viewport.height - 128);
    expect(frame.sprite).toMatch(/^(lay_0|sit_0|idle_0)$/);
  });

  it("resumes autonomous scheduling after landing recovery", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      rng: new SequenceRng([0.1, 0.9, 0, 0, 0, 0, 0, 0, 0, 0]),
    });

    engine.call();
    let time = 0;
    let frame = engine.tick(time);
    while (frame.y < viewport.height - 128 && time < 60000) {
      time += 16;
      frame = engine.tick(time);
    }

    const changesAfterLanding: string[] = [];
    let previousSprite = frame.sprite;
    for (; time < 40000; time += 16) {
      frame = engine.tick(time);
      if (frame.sprite !== previousSprite) {
        changesAfterLanding.push(frame.sprite);
        previousSprite = frame.sprite;
      }
    }
    expect(changesAfterLanding.length).toBeGreaterThanOrEqual(1);

    const changesThroughTwoMinutes = [...changesAfterLanding];
    for (; time < 120000; time += 16) {
      frame = engine.tick(time);
      if (frame.sprite !== previousSprite) {
        changesThroughTwoMinutes.push(frame.sprite);
        previousSprite = frame.sprite;
      }
    }
    expect(changesThroughTwoMinutes.length).toBeGreaterThanOrEqual(2);
  });

  it("walks in from the left and settles at x=100", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      rng: new SequenceRng([0.9, 0.1]),
    });

    engine.call();
    const frame = tickUntil(engine, (next) => next.sprite === "idle_0");

    expect(frame.x).toBeGreaterThanOrEqual(100);
    expect(frame.x).toBeLessThan(103);
    expect(frame.sprite).toBe("idle_0");
  });

  it("pins the grabbed sprite and throws it with positive velocity", () => {
    let now = 0;
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
      now: () => now,
    });

    engine.call();
    engine.pointerDown(300, 300);
    expect(engine.tick(now).sprite).toBe("hang_0");
    expect(engine.tick(now).x).toBe(230);

    now = 10;
    engine.pointerMove(400, 300);
    engine.pointerUp();
    const afterThrow = engine.tick(now + 101);
    expect(afterThrow.x).toBeGreaterThan(230);
    expect(afterThrow.sprite).toBe("fall_0");

    let sawSlide = false;
    let frame = afterThrow;
    for (let index = 1; index < 1000; index += 1) {
      frame = engine.tick(now + 101 + index * 16);
      if (frame.sprite === "lay_0") sawSlide = true;
      if (frame.sprite === "lay_0" && frame.y === viewport.height - 128) {
        break;
      }
    }
    expect(sawSlide).toBe(true);
    expect(frame.x).toBeGreaterThanOrEqual(-35);
    expect(frame.x).toBeLessThanOrEqual(viewport.width - 128 + 35);
  });

  it("bounces off the top edge when thrown upward instead of leaving the screen", () => {
    let now = 0;
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
      now: () => now,
    });

    engine.call();
    engine.pointerDown(300, 300);
    engine.tick(now);
    now = 10;
    engine.pointerMove(300, 50);
    engine.pointerUp();

    let frame = engine.tick(now);
    let minY = frame.y;
    for (let index = 1; index < 1000; index += 1) {
      frame = engine.tick(now + index * 16);
      minY = Math.min(minY, frame.y);
      if (frame.y === viewport.height - 128) break;
    }
    expect(minY).toBe(0);
    expect(frame.y).toBe(viewport.height - 128);
  });

  it("walks off-screen when asked to leave", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
    });

    engine.call();
    engine.leave();
    for (let index = 1; index < 1000 && engine.present; index += 1) {
      engine.tick(index * 16);
    }

    expect(engine.present).toBe(false);
  });

  it("clamps the sprite to a shorter viewport", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
    });

    engine.call();
    engine.pointerDown(300, 590);
    engine.setViewport({ width: 800, height: 300 });

    expect(engine.tick(0).y).toBe(172);
  });

  it("does not autonomously leave idle in reduced-motion mode", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
    });

    engine.call();
    for (let index = 1; index <= 60; index += 1) {
      const frame = engine.tick(index * 1000);
      expect(["walk_0", "walk_1", "walk_2", "crawl_0", "crawl_1", "lay_0"]).not.toContain(
        frame.sprite
      );
    }
  });

  it("schedules a forced walk after the idle deadline and returns to idle", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      rng: new SequenceRng([0.9, 0.1, 0, 0.1, 0.1]),
    });

    engine.call();
    tickUntil(engine, (frame) => frame.sprite === "idle_0");
    const walk = engine.tick(6000);
    expect(walk.sprite).toMatch(/^walk_/);

    const idle = engine.tick(36000);
    expect(idle.sprite).toBe("idle_0");
  });

  it("walks to a target and returns to idle with the scheduler alive", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      rng: new SequenceRng([0.9, 0.1, 0, 0, 0, 0]),
    });

    engine.call();
    tickUntil(engine, (frame) => frame.sprite === "idle_0");
    engine.walkTo(500);

    let frame = engine.tick(5000);
    for (let time = 5016; time < 10000 && frame.sprite !== "idle_0"; time += 16) {
      frame = engine.tick(time);
    }
    expect(frame.sprite).toBe("idle_0");
    expect(frame.x).toBe(436);

    const later = engine.tick(20000);
    expect(later.sprite).toMatch(/^(walk_|sit_|crawl_|lay_)/);
  });

  it("ignores walkTo while dragging", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
    });

    engine.call();
    engine.pointerDown(300, 300);
    const grabbed = engine.tick(0);
    engine.walkTo(700);

    expect(engine.tick(16).x).toBe(grabbed.x);
    expect(engine.tick(16).sprite).toBe("hang_0");
  });

  it("hops from the floor and lands through recovery", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: false,
      rng: new SequenceRng([0.9, 0.1, 0, 0, 0]),
    });

    engine.call();
    const landed = tickUntil(engine, (frame) => frame.sprite === "idle_0");
    expect(landed.y).toBe(viewport.height - 128);

    engine.hop();
    const airborne = engine.tick(5000);
    expect(airborne.y).toBeLessThan(viewport.height - 128);

    const recovered = tickUntil(
      engine,
      (frame) =>
        frame.y === viewport.height - 128 &&
        /^(lay_0|sit_0|idle_0)$/.test(frame.sprite),
      5000
    );
    expect(recovered.y).toBe(viewport.height - 128);
  });

  it("uses reduced-motion walkTo only to face the target", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
    });

    engine.call();
    const before = engine.tick(0);
    engine.walkTo(0);
    const after = engine.tick(1000);

    expect(after.x).toBe(before.x);
    expect(after.sprite).toBe("idle_0");
    expect(after.scaleX).toBe(1);
  });
});
