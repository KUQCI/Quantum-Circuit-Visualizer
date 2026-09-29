import { describe, expect, it } from "vitest";
import {
  alphaMaskFromRgba,
  isSpritePixelOpaque,
} from "@/lib/quanta-buddy/hit-test";

function leftHalfOpaqueMask(size: number) {
  const rgba = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size / 2; x++) rgba[(y * size + x) * 4 + 3] = 255;
  }
  return alphaMaskFromRgba(rgba, size, size);
}

describe("quanta buddy hit test", () => {
  const mask = leftHalfOpaqueMask(128);

  it("hits opaque pixels and passes through transparent ones", () => {
    expect(isSpritePixelOpaque(mask, 100, 200, 1, 110, 250)).toBe(true);
    expect(isSpritePixelOpaque(mask, 100, 200, 1, 220, 250)).toBe(false);
  });

  it("mirrors the mask when the sprite is flipped", () => {
    expect(isSpritePixelOpaque(mask, 100, 200, -1, 110, 250)).toBe(false);
    expect(isSpritePixelOpaque(mask, 100, 200, -1, 220, 250)).toBe(true);
  });

  it("ignores points outside the sprite box", () => {
    expect(isSpritePixelOpaque(mask, 100, 200, 1, 99, 250)).toBe(false);
    expect(isSpritePixelOpaque(mask, 100, 200, 1, 110, 328)).toBe(false);
  });

  it("scales masks that differ from the rendered size", () => {
    const small = leftHalfOpaqueMask(64);
    expect(isSpritePixelOpaque(small, 0, 0, 1, 10, 10)).toBe(true);
    expect(isSpritePixelOpaque(small, 0, 0, 1, 100, 10)).toBe(false);
  });
});
