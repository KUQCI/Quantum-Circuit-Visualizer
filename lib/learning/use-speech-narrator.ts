"use client";

import { useEffect, useState } from "react";
import {
  createClipNarrator,
  createSpeechNarrator,
  type SpeechNarrator,
} from "@/lib/learning/speech-narrator";
import {
  speechClipHash,
  speechClipUrl,
} from "@/lib/learning/lesson-videos";

export function useSpeechNarrator(): SpeechNarrator {
  const [narrator, setNarrator] = useState(() => createSpeechNarrator(null));

  useEffect(() => {
    const synth =
      typeof window !== "undefined" && "speechSynthesis" in window
        ? window.speechSynthesis
        : null;
    const browserNarrator = createSpeechNarrator(synth);
    const activeNarrator =
      typeof Audio !== "undefined"
        ? createClipNarrator({
            fallback: browserNarrator,
            resolveClipUrl: async (text) => {
              const hash = await speechClipHash(text);
              return hash ? speechClipUrl(hash) : null;
            },
          })
        : browserNarrator;
    setNarrator(activeNarrator);

    return () => activeNarrator.cancel();
  }, []);

  return narrator;
}
