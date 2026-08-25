import { describe, expect, it } from "vitest";
import {
  getQuantaAssetPath,
  getQuantaAssetUrl,
  quantaAssets,
  quantaUsageGuide,
  variantFromFeedback,
} from "@/lib/quanta-assets";

describe("quanta-assets", () => {
  it("exposes core semantic keys", () => {
    expect(quantaAssets.welcome).toContain("quanta-simple-duck");
    expect(quantaAssets.learning).toContain("hatching-curious");
    expect(quantaAssets.success).toContain("trophy");
    expect(quantaAssets.error).toContain("surprised");
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
});
