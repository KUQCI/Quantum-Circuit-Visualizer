import { describe, expect, it } from "vitest";
import {
  BURST_RESPAWN_DELAY,
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

  it("keeps its position on grab, eases to the drag pin, and throws right", () => {
    let now = 0;
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
      now: () => now,
    });

    engine.call();
    const beforeGrab = engine.tick(now);
    engine.pointerDown(150, 484);
    expect(engine.tick(now)).toMatchObject({
      x: beforeGrab.x,
      y: beforeGrab.y,
      sprite: "hang_0",
    });

    let previous = engine.tick(now);
    for (now = 16; now <= 144; now += 16) {
      if (now % 32 === 0) engine.pointerMove(150, 484);
      const frame = engine.tick(now);
      expect(Math.hypot(frame.x - previous.x, frame.y - previous.y)).toBeLessThan(16);
      previous = frame;
    }
    now = 150;
    const pinned = engine.tick(now);
    expect(pinned.x).toBe(92);
    expect(pinned.y).toBe(472);

    now = 182;
    engine.pointerMove(250, 484);
    engine.pointerUp();
    const afterThrow = engine.tick(now + 101);
    expect(afterThrow.x).toBeGreaterThan(pinned.x);
    expect(afterThrow.sprite).toBe("lay_0");

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
    engine.pointerDown(150, 484);
    engine.tick(now);
    now = 32;
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

  it("clamps dragged coordinates to the viewport bounds", () => {
    let now = 0;
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
      now: () => now,
    });

    engine.call();
    engine.tick(now);
    engine.pointerDown(150, 500);
    now = 32;
    engine.pointerMove(5000, -100);
    expect(engine.tick(now)).toMatchObject({ x: 707, y: 0 });
    now = 64;
    engine.pointerMove(-5000, 1000);
    expect(engine.tick(now).x).toBe(-35);
    expect(engine.tick(now).y).toBe(472);
  });

  it("ignores a one-millisecond pointer spike when estimating throw speed", () => {
    let now = 0;
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
      now: () => now,
    });

    engine.call();
    engine.tick(now);
    engine.pointerDown(150, 500);
    now = 32;
    engine.pointerMove(155, 500);
    now = 64;
    engine.pointerMove(160, 500);
    now = 96;
    engine.pointerMove(165, 500);
    now = 97;
    engine.pointerMove(205, 500);
    engine.pointerUp(205, 500);

    expect(engine.present).toBe(true);
    expect(engine.consumeBurst()).toBeNull();
  });

  it("caps throw velocity at 30 pixels per frame", () => {
    let now = 0;
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
      now: () => now,
    });

    engine.call();
    engine.tick(now);
    engine.pointerDown(150, 400);
    now = 16;
    engine.pointerMove(270, 400);
    const released = engine.tick(now);
    engine.pointerUp();
    const thrown = engine.tick(now + 16);

    expect(thrown.x - released.x).toBeCloseTo(30, 0);
  });

  it("does not use throw velocity samples older than 100 milliseconds", () => {
    let now = 0;
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
      now: () => now,
    });

    engine.call();
    engine.tick(now);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      engine.pointerDown(150, 400);
      now += 16;
      engine.pointerMove(270, 400);
      now += 101;
      engine.pointerUp();
      expect(engine.present).toBe(true);
      expect(engine.consumeBurst()).toBeNull();
      engine.tick(now);
    }
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
    engine.pointerDown(150, 500);
    const grabbed = engine.tick(0);
    engine.walkTo(700);

    const moving = engine.tick(16);
    expect(moving.x).toBeLessThan(grabbed.x + 2);
    expect(moving.sprite).toBe("hang_0");
  });

  it("pauses walk movement while frozen", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
    });

    engine.call();
    engine.tick(0);
    engine.walkAround();
    const start = engine.tick(1);
    engine.setFrozen(true);
    for (let time = 17; time <= 34993; time += 16) {
      expect(engine.tick(time).x).toBe(start.x);
    }
    expect(engine.tick(35001).sprite).toBe("walk_0");
    engine.setFrozen(false);
    expect(engine.tick(35017).x).not.toBe(start.x);
  });

  it("pauses behavior deadlines while frozen", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
    });

    engine.call();
    engine.tick(0);
    engine.sit();
    expect(engine.isSitting).toBe(true);
    engine.setFrozen(true);
    expect(engine.tick(16000).sprite).toBe("sit_0");
    engine.setFrozen(false);
    expect(engine.tick(16016).sprite).toBe("sit_0");
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

  it("sleeps in place and stays asleep while ticking", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
    });

    engine.call();
    engine.sleep();
    expect(engine.tick(0)).toMatchObject({
      sprite: "lay_0",
      sleeping: true,
    });
    expect(engine.tick(30000)).toMatchObject({
      sprite: "lay_0",
      sleeping: true,
    });
  });

  it("pauses landing recovery while frozen to preserve the lay pose", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: false,
      rng: new SequenceRng([0.9, 0.1, 0, 0, 0]),
    });

    engine.call();
    let time = 0;
    let frame = engine.tick(time);
    while (frame.sprite !== "idle_0" && time < 60000) {
      time += 16;
      frame = engine.tick(time);
    }
    expect(frame.sprite).toBe("idle_0");

    engine.hop();
    while (frame.sprite !== "lay_0" && time < 120000) {
      time += 16;
      frame = engine.tick(time);
    }
    expect(frame.sprite).toBe("lay_0");

    engine.setFrozen(true);
    const frozenUntil = time + 5000;
    while (time < frozenUntil) {
      time += 16;
      frame = engine.tick(time);
    }

    expect(frame.sprite).toBe("lay_0");
    engine.setFrozen(false);
    expect(engine.tick(time + 16).sprite).toBe("lay_0");
  });

  it("wakes into sitting and resumes its behavior cycle", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      rng: new SequenceRng([0.9, 0.1, 0, 0, 0, 0]),
    });

    engine.call();
    tickUntil(engine, (frame) => frame.sprite === "idle_0");
    engine.sleep();
    engine.wake();
    expect(engine.tick(0)).toMatchObject({
      sprite: "sit_0",
      sleeping: false,
    });
    const later = engine.tick(4000);
    expect(later.sleeping).toBe(false);
    expect(later.sprite).not.toBe("lay_0");
  });

  it("wakes when grabbed while asleep", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
    });

    engine.call();
    engine.sleep();
    engine.pointerDown(300, 300);
    expect(engine.tick(0).sleeping).toBe(false);
  });

  it("does not sleep while busy falling", () => {
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
    });

    engine.call();
    engine.pointerDown(300, 300);
    engine.pointerMove(400, 300);
    engine.pointerUp();
    engine.sleep();
    expect(engine.tick(0).sleeping).toBe(false);
  });

  it("bursts after too many quick pokes and respawns later", () => {
    let now = 0;
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
      now: () => now,
    });
    engine.call();
    engine.tick(now);

    for (let index = 0; index < 5; index += 1) {
      now += 200;
      engine.tick(now);
      expect(engine.poke()).toBe(index + 1);
    }
    now += 200;
    engine.tick(now);
    expect(engine.poke()).toBe("burst");
    expect(engine.present).toBe(false);
    expect(engine.consumeBurst()).toEqual({
      x: 164,
      y: viewport.height - 64,
      reason: "poked",
    });
    expect(engine.consumeBurst()).toBeNull();

    engine.tick(now);
    expect(engine.tick(now + BURST_RESPAWN_DELAY - 1).present).toBe(false);
    expect(engine.tick(now + BURST_RESPAWN_DELAY).present).toBe(true);
  });

  it("times the respawn from the first frame after the burst", () => {
    let now = 0;
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
      now: () => now,
    });
    engine.call();
    engine.tick(now);
    for (let index = 0; index < 6; index += 1) {
      now += 100;
      engine.poke();
    }
    expect(engine.present).toBe(false);

    // Frame clock jumped far ahead (e.g. tab was throttled) before the burst.
    const frameTime = 60000;
    expect(engine.tick(frameTime).present).toBe(false);
    expect(
      engine.tick(frameTime + BURST_RESPAWN_DELAY - 1).present
    ).toBe(false);
    expect(engine.tick(frameTime + BURST_RESPAWN_DELAY).present).toBe(true);
  });

  it("ignores slow pokes spread over time", () => {
    let now = 0;
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
      now: () => now,
    });
    engine.call();
    for (let index = 0; index < 20; index += 1) {
      now += 1500;
      expect(engine.poke()).toBeLessThanOrEqual(3);
    }
    expect(engine.present).toBe(true);
  });

  it("bursts when thrown too many times in a row", () => {
    let now = 0;
    const engine = new QuantaBuddyEngine({
      viewport,
      reducedMotion: true,
      now: () => now,
    });
    engine.call();
    engine.tick(now);

    const throwOnce = () => {
      engine.pointerDown(150, 500);
      engine.tick(now);
      now += 32;
      engine.pointerMove(150, 400);
      engine.pointerUp();
      now += 500;
      engine.tick(now);
    };

    for (let index = 0; index < 3; index += 1) {
      throwOnce();
      expect(engine.present).toBe(true);
    }
    throwOnce();
    expect(engine.present).toBe(false);
    expect(engine.consumeBurst()?.reason).toBe("thrown");
  });
});
