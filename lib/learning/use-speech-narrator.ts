"use client";

import { useEffect, useState } from "react";
import {
  createSpeechNarrator,
  type SpeechNarrator,
} from "@/lib/learning/speech-narrator";

export function useSpeechNarrator(): SpeechNarrator {
  const [narrator, setNarrator] = useState(() => createSpeechNarrator(null));

  useEffect(() => {
    const synth =
      typeof window !== "undefined" && "speechSynthesis" in window
        ? window.speechSynthesis
        : null;
    const browserNarrator = createSpeechNarrator(synth);
    setNarrator(browserNarrator);

    return () => browserNarrator.cancel();
  }, []);

  return narrator;
}
