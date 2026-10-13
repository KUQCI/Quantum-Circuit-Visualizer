export const LESSON_VIDEO_BASE_URL =
  process.env.NEXT_PUBLIC_LESSON_VIDEO_BASE_URL ||
  "https://github.com/KUQCI/Quantum-Circuit-Visualizer/releases/download/lesson-videos";

export function lessonVideoUrl(id: string): string {
  return `${LESSON_VIDEO_BASE_URL.replace(/\/+$/, "")}/${encodeURIComponent(id)}.mp4`;
}

export async function speechClipHash(text: string): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;

  const digest = await subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  )
    .join("")
    .slice(0, 16);
}

export function speechClipUrl(hash: string): string {
  return `${LESSON_VIDEO_BASE_URL.replace(/\/+$/, "")}/speech-${encodeURIComponent(hash)}.mp3`;
}
