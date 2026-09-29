import { describe, expect, it } from "vitest";
import {
  buddySpriteUrl,
  getQuantaAssetPath,
  getQuantaAssetUrl,
  quantaAssets,
  quantaUsageGuide,
  variantFromFeedback,
} from "@/lib/quanta-assets";

describe("quanta-assets", () => {
  it("resolves buddy sprites through the public asset path", () => {
    expect(buddySpriteUrl("idle_0")).toMatch(
      /\/assets\/quanta\/buddy\/idle_0\.png$/
    );
  });

  it("exposes core semantic keys", () => {
    expect(quantaAssets.welcome).toContain("quanta-simple-duck.webp");
    expect(quantaAssets.learning).toContain("hatching-curious.webp");
    expect(quantaAssets.success).toContain("trophy.webp");
    expect(quantaAssets.error).toContain("surprised.webp");
    expect(quantaAssets.empty).toContain("egg-waiting");
  });

  it("maps variants to paths", () => {
    expect(getQuantaAssetPath("thinking")).toBe(quantaAssets.thinking);
    expect(getQuantaAssetPath("welcome")).toBe(quantaAssets.welcome);
  });

  it("maps feedback kinds to variants", () => {
    expect(variantFromFeedback("hint")).toBe("thinking");
    expect(variantFromFeedback("success")).toBe("success");
    expect(variantFromFeedback("error")).toBe("error");
  });

  it("includes usage guide for gallery", () => {
    expect(quantaUsageGuide.length).toBeGreaterThanOrEqual(10);
  });

  it("prefixes base path when configured", () => {
    const url = getQuantaAssetUrl("welcome");
    expect(url).toContain("/assets/quanta/");
  });

  it("resolves intro assets under the base path", () => {
    expect(getQuantaAssetPath("introVideo")).toBe(quantaAssets.introVideo);
    expect(getQuantaAssetPath("introPoster")).toBe(quantaAssets.introPoster);
    expect(getQuantaAssetUrl("introVideo")).toContain(
      "/assets/quanta/intro/door-open.mp4"
    );
    expect(getQuantaAssetUrl("introPoster")).toContain(
      "/assets/quanta/intro/door-poster.jpg"
    );
  });
});
