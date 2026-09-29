export const SPRITE_HIT_SIZE = 128;
export const SPRITE_ALPHA_THRESHOLD = 32;

export interface SpriteAlphaMask {
  width: number;
  height: number;
  alpha: Uint8Array;
}

export function alphaMaskFromRgba(
  rgba: ArrayLike<number>,
  width: number,
  height: number
): SpriteAlphaMask {
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3];
  return { width, height, alpha };
}

/**
 * Whether a viewport point lands on an opaque pixel of the sprite drawn at
 * (`spriteX`, `spriteY`) with a horizontal `scaleX` flip about its center.
 */
export function isSpritePixelOpaque(
  mask: SpriteAlphaMask,
  spriteX: number,
  spriteY: number,
  scaleX: 1 | -1,
  pointX: number,
  pointY: number,
  size = SPRITE_HIT_SIZE,
  threshold = SPRITE_ALPHA_THRESHOLD
): boolean {
  let localX = pointX - spriteX;
  const localY = pointY - spriteY;
  if (localX < 0 || localY < 0 || localX >= size || localY >= size) return false;
  if (scaleX === -1) localX = size - 1 - localX;
  const px = Math.min(mask.width - 1, Math.floor((localX / size) * mask.width));
  const py = Math.min(mask.height - 1, Math.floor((localY / size) * mask.height));
  return mask.alpha[py * mask.width + px] >= threshold;
}
