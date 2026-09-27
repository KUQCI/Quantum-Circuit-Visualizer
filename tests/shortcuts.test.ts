import { describe, expect, it } from "vitest";
import { SHORTCUT_GROUPS } from "@/lib/shortcuts";

describe("keyboard shortcut definitions", () => {
  it("has non-empty groups and unique descriptions", () => {
    expect(SHORTCUT_GROUPS.length).toBeGreaterThan(0);
    const descriptions = new Set<string>();

    for (const group of SHORTCUT_GROUPS) {
      expect(group.title.trim()).not.toBe("");
      expect(group.items.length).toBeGreaterThan(0);
      for (const item of group.items) {
        expect(item.keys.length).toBeGreaterThan(0);
        expect(item.description.trim()).not.toBe("");
        expect(descriptions.has(item.description)).toBe(false);
        descriptions.add(item.description);
      }
    }
  });
});
