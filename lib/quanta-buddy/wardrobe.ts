export type HatId =
  | "eggshell"
  | "propeller"
  | "mortarboard"
  | "hardhat"
  | "wizard"
  | "tophat"
  | "crown";

export type SkinId = "classic" | "mint" | "qubit" | "rose" | "violet" | "golden";

export interface WardrobeItem<Id extends string> {
  id: Id;
  name: string;
  level: number;
}

export const HATS: WardrobeItem<HatId>[] = [
  { id: "eggshell", name: "Eggshell", level: 2 },
  { id: "propeller", name: "Propeller cap", level: 4 },
  { id: "mortarboard", name: "Graduation cap", level: 5 },
  { id: "hardhat", name: "Hard hat", level: 7 },
  { id: "wizard", name: "Wizard hat", level: 8 },
  { id: "tophat", name: "Top hat", level: 10 },
  { id: "crown", name: "Crown", level: 12 },
];

export const SKINS: WardrobeItem<SkinId>[] = [
  { id: "classic", name: "Classic", level: 1 },
  { id: "mint", name: "Mint", level: 3 },
  { id: "qubit", name: "Qubit blue", level: 6 },
  { id: "rose", name: "Rose", level: 9 },
  { id: "violet", name: "Superposition violet", level: 11 },
  { id: "golden", name: "Golden", level: 12 },
];

export const SKIN_FILTERS: Record<SkinId, string> = {
  classic: "",
  mint: "hue-rotate(95deg) saturate(0.85)",
  qubit: "hue-rotate(160deg) saturate(1.1)",
  rose: "hue-rotate(-85deg) saturate(0.8) brightness(1.05)",
  violet: "hue-rotate(190deg) saturate(0.9)",
  golden: "sepia(0.6) saturate(2.2) hue-rotate(-14deg) brightness(0.95)",
};

export function isUnlocked(item: { level: number }, level: number): boolean {
  return level >= item.level;
}

/** Items that unlock exactly when moving from `fromLevel` to `toLevel`. */
export function newlyUnlocked<Id extends string>(
  items: WardrobeItem<Id>[],
  fromLevel: number,
  toLevel: number
): WardrobeItem<Id>[] {
  return items.filter((item) => item.level > fromLevel && item.level <= toLevel);
}

export interface HatAnchor {
  /** Bottom-center of the hat in unflipped 128px sprite coordinates. */
  x: number;
  y: number;
  /** Degrees, clockwise, before any horizontal flip. */
  rotate: number;
}

export const HAT_ANCHORS: Record<string, HatAnchor> = {
  idle_0: { x: 46, y: 37, rotate: -6 },
  walk_0: { x: 46, y: 37, rotate: -6 },
  walk_1: { x: 47, y: 36, rotate: -6 },
  walk_2: { x: 43, y: 36, rotate: -8 },
  sit_0: { x: 62, y: 45, rotate: -4 },
  hang_0: { x: 46, y: 9, rotate: 6 },
  hang_1: { x: 46, y: 9, rotate: 6 },
  hang_2: { x: 46, y: 9, rotate: 6 },
  hang_3: { x: 46, y: 9, rotate: 6 },
  hang_4: { x: 46, y: 9, rotate: 6 },
  fall_0: { x: 38, y: 24, rotate: -14 },
  fall_1: { x: 44, y: 18, rotate: -4 },
  lay_0: { x: 28, y: 97, rotate: -22 },
  crawl_0: { x: 22, y: 95, rotate: -22 },
  crawl_1: { x: 28, y: 97, rotate: -22 },
};

export const HAT_WIDTH = 44;
export const HAT_HEIGHT = 40;
export const SPRITE_SIZE = 128;

/**
 * CSS transform that places a HAT_WIDTH×HAT_HEIGHT hat box on a sprite drawn at
 * (`spriteX`, `spriteY`) with a horizontal `scaleX` flip about its center.
 */
export function hatTransform(
  sprite: string,
  spriteX: number,
  spriteY: number,
  scaleX: 1 | -1
): string | null {
  const anchor = HAT_ANCHORS[sprite];
  if (!anchor) return null;
  const localX = scaleX === 1 ? anchor.x : SPRITE_SIZE - anchor.x;
  const left = spriteX + localX - HAT_WIDTH / 2;
  const top = spriteY + anchor.y - HAT_HEIGHT;
  const rotate = anchor.rotate * scaleX;
  return `translate(${left}px, ${top}px) rotate(${rotate}deg) scaleX(${scaleX})`;
}
