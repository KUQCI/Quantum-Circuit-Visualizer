import { describe, expect, it } from "vitest";
import {
  HATS,
  HAT_ANCHORS,
  SKINS,
  hatTransform,
  isUnlocked,
  newlyUnlocked,
} from "@/lib/quanta-buddy/wardrobe";
import { SPRITE_NAMES } from "@/lib/quanta-buddy/engine";

describe("Quanta wardrobe", () => {
  it("checks unlock boundaries", () => {
    const hat = HATS.find((item) => item.id === "mortarboard");
    expect(hat).toBeDefined();
    expect(isUnlocked(hat!, 4)).toBe(false);
    expect(isUnlocked(hat!, 5)).toBe(true);
    expect(isUnlocked(hat!, 6)).toBe(true);
  });

  it("returns only the mortarboard at level five", () => {
    expect(newlyUnlocked(HATS, 4, 5).map((item) => item.id)).toEqual([
      "mortarboard",
    ]);
  });

  it("returns all seven hats when progressing from level one to twelve", () => {
    expect(newlyUnlocked(HATS, 1, 12).map((item) => item.id)).toEqual(
      HATS.map((item) => item.id)
    );
    expect(newlyUnlocked(HATS, 1, 12)).toHaveLength(7);
  });

  it("returns only mint when progressing from level two to three", () => {
    expect(newlyUnlocked(SKINS, 2, 3).map((item) => item.id)).toEqual([
      "mint",
    ]);
  });

  it("positions a hat on an unflipped idle sprite", () => {
    expect(hatTransform("idle_0", 100, 200, 1)).toBe(
      "translate(124px, 197px) rotate(-6deg) scaleX(1)"
    );
  });

  it("positions a hat on a flipped idle sprite", () => {
    expect(hatTransform("idle_0", 100, 200, -1)).toBe(
      "translate(160px, 197px) rotate(6deg) scaleX(-1)"
    );
  });

  it("returns null for an unknown sprite", () => {
    expect(hatTransform("unknown", 100, 200, 1)).toBeNull();
  });

  it("has a hat anchor for every buddy sprite", () => {
    for (const sprite of SPRITE_NAMES) {
      expect(HAT_ANCHORS[sprite]).toBeDefined();
    }
  });
});
