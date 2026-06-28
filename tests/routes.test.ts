import { describe, expect, it } from "vitest";
import {
  isEditorPath,
  isFullWorkspacePath,
  isPathActive,
  normalizePath,
  withBasePath,
} from "@/lib/routes";

describe("routes", () => {
  it("normalizes trailing slashes", () => {
    expect(normalizePath("/editor/")).toBe("/editor");
    expect(normalizePath("/editor")).toBe("/editor");
    expect(normalizePath("/")).toBe("/");
  });

  it("detects editor path with or without trailing slash", () => {
    expect(isEditorPath("/editor")).toBe(true);
    expect(isEditorPath("/editor/")).toBe(true);
    expect(isEditorPath("/learn")).toBe(false);
  });

  it("detects workspace paths", () => {
    expect(isFullWorkspacePath("/editor/")).toBe(true);
    expect(isFullWorkspacePath("/learn/foo/")).toBe(true);
  });

  it("matches active nav paths with trailing slashes", () => {
    expect(isPathActive("/", "/")).toBe(true);
    expect(isPathActive("/editor/", "/editor")).toBe(true);
    expect(isPathActive("/projects/", "/projects")).toBe(true);
    expect(isPathActive("/learn/foo/", "/learn")).toBe(true);
    expect(isPathActive("/challenges/bar/", "/challenges")).toBe(true);
    expect(isPathActive("/editor/", "/learn")).toBe(false);
  });

  it("prefixes base path for imperative navigation", () => {
    const prev = process.env.NEXT_PUBLIC_BASE_PATH;
    process.env.NEXT_PUBLIC_BASE_PATH = "/Quantum-Circuit-Visualizer";
    expect(withBasePath("/editor")).toBe("/Quantum-Circuit-Visualizer/editor");
    expect(withBasePath("/")).toBe("/Quantum-Circuit-Visualizer/");
    process.env.NEXT_PUBLIC_BASE_PATH = prev;
  });
});
