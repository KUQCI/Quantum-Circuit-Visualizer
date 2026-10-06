import { afterEach, describe, expect, it, vi } from "vitest";

describe("PWA manifest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("prefixes the install URLs with the configured base path", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/Quantum-Circuit-Visualizer");
    vi.resetModules();

    const { default: createManifest } = await import("../app/manifest");
    const manifest = createManifest();

    expect(manifest.start_url).toBe("/Quantum-Circuit-Visualizer/");
    expect(manifest.scope).toBe("/Quantum-Circuit-Visualizer/");
    expect(manifest.icons?.map((icon) => icon.src)).toContain(
      "/Quantum-Circuit-Visualizer/icons/icon-192.png"
    );
    expect(
      manifest.icons?.find((icon) => icon.purpose === "maskable")?.src
    ).toBe("/Quantum-Circuit-Visualizer/icons/icon-maskable-512.png");
  });
});
