import { withBasePath } from "@/lib/routes";

/**
 * Central Quanta mascot asset registry.
 * Paths are relative to `public/` — use `getQuantaAssetUrl()` for GitHub Pages basePath.
 */
export const quantaAssets = {
  welcome: "/assets/quanta/quanta-simple-duck.jpeg",
  learning: "/assets/quanta/quanta-hatching-curious.jpeg",
  thinking: "/assets/quanta/quanta-hatching-thinking.jpeg",
  waiting: "/assets/quanta/quanta-tick-tock.jpeg",
  success: "/assets/quanta/quanta-trophy.jpeg",
  coding: "/assets/quanta/quanta-coding-power.jpeg",
  researcher: "/assets/quanta/quanta-researcher-chip.jpeg",
  announcement: "/assets/quanta/quanta-workshop-announcement-1.jpeg",
  announcementAlt: "/assets/quanta/quanta-workshop-announcement-2.jpeg",
  didYouCode: "/assets/quanta/quanta-did-you-code.jpeg",
  error: "/assets/quanta/quanta-hatching-surprised.jpeg",
  empty: "/assets/quanta/quanta-egg-waiting-1.jpeg",
  emptyNervous: "/assets/quanta/quanta-egg-waiting-sweat.jpeg",
  sleepy: "/assets/quanta/quanta-hatching-sleepy.jpeg",
  hatchingNeutral: "/assets/quanta/quanta-hatching-neutral.jpeg",
  avatar: "/assets/quanta/quanta-head-blue-bg.jpeg",
  rubberDuck: "/assets/quanta/quanta-rubber-duck.jpeg",
  contactSheet: "/assets/quanta/quanta-contact-sheet.jpg",
} as const;

export type QuantaAssetKey = keyof typeof quantaAssets;

export type QuantaVariant =
  | "welcome"
  | "learning"
  | "thinking"
  | "waiting"
  | "success"
  | "coding"
  | "researcher"
  | "announcement"
  | "didYouCode"
  | "error"
  | "empty"
  | "avatar";

/** Map semantic variants to registry keys (stable API for components). */
export const quantaVariantMap: Record<QuantaVariant, QuantaAssetKey> = {
  welcome: "welcome",
  learning: "learning",
  thinking: "thinking",
  waiting: "waiting",
  success: "success",
  coding: "coding",
  researcher: "researcher",
  announcement: "announcement",
  didYouCode: "didYouCode",
  error: "error",
  empty: "empty",
  avatar: "avatar",
};

export const quantaAltText: Record<QuantaVariant, string> = {
  welcome: "Quanta the duck, smiling and ready to help",
  learning: "Baby Quanta hatching from an egg, looking curious",
  thinking: "Baby Quanta hatching and thinking",
  waiting: "Quanta checking a watch — tick tock",
  success: "Quanta celebrating inside a trophy",
  coding: "Quanta coding with quantum energy",
  researcher: "Researcher Quanta inspecting a circuit chip",
  announcement: "Quanta announcing a workshop",
  didYouCode: "Quanta asking Did you code today?",
  error: "Surprised Quanta reacting to a hatching egg",
  empty: "Quanta waiting beside an egg — nothing hatched yet",
  avatar: "Quanta head portrait",
};

export const quantaUsageGuide: {
  variant: QuantaVariant;
  label: string;
  usage: string;
}[] = [
  { variant: "welcome", label: "Welcome", usage: "Home Meet Quanta card, onboarding" },
  { variant: "learning", label: "Learning", usage: "Learn dashboard, beginner lessons" },
  { variant: "thinking", label: "Hint", usage: "Lesson hints and tip bubbles" },
  { variant: "waiting", label: "Waiting", usage: "Incomplete challenges, streak reminders" },
  { variant: "success", label: "Success", usage: "Achievements, lesson complete" },
  { variant: "coding", label: "Coding", usage: "Challenges header, Build promo" },
  { variant: "researcher", label: "Researcher", usage: "Docs, debug, technical help" },
  { variant: "announcement", label: "Announcement", usage: "Events and learning announcements" },
  { variant: "didYouCode", label: "Did you code?", usage: "Progress / streak page" },
  { variant: "error", label: "Error", usage: "Parser failures, incorrect answers" },
  { variant: "empty", label: "Empty state", usage: "No projects, empty lists" },
  { variant: "avatar", label: "Avatar", usage: "Compact Quanta face accents" },
];

export function getQuantaAssetPath(key: QuantaAssetKey | QuantaVariant): string {
  const assetKey =
    key in quantaAssets
      ? (key as QuantaAssetKey)
      : quantaVariantMap[key as QuantaVariant];
  return quantaAssets[assetKey];
}

/** Public URL including GitHub Pages basePath when set. */
export function getQuantaAssetUrl(key: QuantaAssetKey | QuantaVariant): string {
  return withBasePath(getQuantaAssetPath(key));
}

export function variantFromFeedback(
  kind: "default" | "success" | "hint" | "error" | "waiting"
): QuantaVariant {
  switch (kind) {
    case "success":
      return "success";
    case "hint":
      return "thinking";
    case "error":
      return "error";
    case "waiting":
      return "waiting";
    default:
      return "welcome";
  }
}
