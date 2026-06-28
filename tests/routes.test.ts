import { describe, expect, it } from "vitest";
import {
  isEditorPath,
  isFullWorkspacePath,
  normalizePath,
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
});
