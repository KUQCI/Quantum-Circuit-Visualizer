export const LESSON_VIDEO_BASE_URL =
  process.env.NEXT_PUBLIC_LESSON_VIDEO_BASE_URL ||
  "https://github.com/KUQCI/Quantum-Circuit-Visualizer/releases/download/lesson-videos";

export function lessonVideoUrl(id: string): string {
  return `${LESSON_VIDEO_BASE_URL.replace(/\/+$/, "")}/${encodeURIComponent(id)}.mp4`;
}
