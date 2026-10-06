import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildPrecacheList } from "../scripts/pwa-precache.mjs";

describe("buildPrecacheList", () => {
  let outDir: string;

  const writeFixture = (relativePath: string, contents: string | Buffer) => {
    const path = join(outDir, relativePath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents);
  };

  beforeEach(() => {
    outDir = mkdtempSync(join(tmpdir(), "qcv-pwa-"));
  });

  afterEach(() => {
    rmSync(outDir, { recursive: true, force: true });
  });

  it("maps routes and includes static app assets while excluding large and non-app files", () => {
    writeFixture("index.html", "home");
    writeFixture("editor/index.html", "editor");
    writeFixture("_next/static/chunks/app.js", "bundle");
    writeFixture("_next/static/chunks/app/learn/[lessonId]/page.js", "lesson");
    writeFixture("payload.txt", "rsc");
    writeFixture("assets/site.css", "styles");
    writeFixture("icons/icon-192.png", "icon");
    writeFixture("manifest.webmanifest", "{}");
    writeFixture("favicon.ico", "favicon");
    writeFixture("404.html", "not found");
    writeFixture("404/index.html", "not found route");
    writeFixture("sw.js", "worker");
    writeFixture("video.mp4", "video");
    writeFixture("bundle.js.map", "source map");
    writeFixture("oversized.txt", Buffer.alloc(1.5 * 1024 * 1024 + 1));

    const result = buildPrecacheList(outDir, "/Quantum-Circuit-Visualizer");

    expect(result.urls).toEqual(
      [
        "/Quantum-Circuit-Visualizer/",
        "/Quantum-Circuit-Visualizer/_next/static/chunks/app.js",
        "/Quantum-Circuit-Visualizer/_next/static/chunks/app/learn/%5BlessonId%5D/page.js",
        "/Quantum-Circuit-Visualizer/assets/site.css",
        "/Quantum-Circuit-Visualizer/editor/",
        "/Quantum-Circuit-Visualizer/favicon.ico",
        "/Quantum-Circuit-Visualizer/icons/icon-192.png",
        "/Quantum-Circuit-Visualizer/manifest.webmanifest",
        "/Quantum-Circuit-Visualizer/payload.txt",
      ].sort()
    );
    expect(result.urls).not.toContain("/Quantum-Circuit-Visualizer/404.html");
    expect(result.urls).not.toContain("/Quantum-Circuit-Visualizer/sw.js");
    expect(result.urls).not.toContain("/Quantum-Circuit-Visualizer/video.mp4");
    expect(result.urls).not.toContain(
      "/Quantum-Circuit-Visualizer/oversized.txt"
    );
    expect(result.urls).not.toContain(
      "/Quantum-Circuit-Visualizer/bundle.js.map"
    );
    expect(result.totalBytes).toBeGreaterThan(0);
  });

  it("keeps the version stable and changes it when an included file changes", () => {
    writeFixture("index.html", "first version");

    const first = buildPrecacheList(outDir, "/base");
    expect(buildPrecacheList(outDir, "/base").version).toBe(first.version);

    writeFixture("index.html", "second version");
    expect(buildPrecacheList(outDir, "/base").version).not.toBe(first.version);
  });
});
