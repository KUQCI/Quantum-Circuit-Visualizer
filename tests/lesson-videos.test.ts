import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("lessonVideoUrl", () => {
  it("uses the release URL by default", async () => {
    vi.stubEnv("NEXT_PUBLIC_LESSON_VIDEO_BASE_URL", "");
    vi.resetModules();
    const { LESSON_VIDEO_BASE_URL, lessonVideoUrl } = await import(
      "@/lib/learning/lesson-videos"
    );

    expect(LESSON_VIDEO_BASE_URL).toContain("/releases/download/lesson-videos");
    expect(lessonVideoUrl("cx-basics")).toBe(
      `${LESSON_VIDEO_BASE_URL}/cx-basics.mp4`
    );
  });

  it("encodes ids and removes trailing base URL slashes", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_LESSON_VIDEO_BASE_URL",
      "https://cdn.example/videos///"
    );
    vi.resetModules();
    const { lessonVideoUrl } = await import("@/lib/learning/lesson-videos");

    expect(lessonVideoUrl("lesson / β")).toBe(
      "https://cdn.example/videos/lesson%20%2F%20%CE%B2.mp4"
    );
  });
});

describe("speech clip URLs", () => {
  it("hashes speech text with SHA-256", async () => {
    const { speechClipHash } = await import("@/lib/learning/lesson-videos");

    await expect(speechClipHash("hello")).resolves.toBe(
      "2cf24dba5fb0a30e"
    );
  });

  it("uses the lesson video base URL for speech clips", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_LESSON_VIDEO_BASE_URL",
      "https://cdn.example/videos///"
    );
    vi.resetModules();
    const { speechClipUrl } = await import("@/lib/learning/lesson-videos");

    expect(speechClipUrl("2cf24dba5fb0a30e")).toBe(
      "https://cdn.example/videos/speech-2cf24dba5fb0a30e.mp3"
    );
  });
});
