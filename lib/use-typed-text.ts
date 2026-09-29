"use client";

import { useEffect, useState } from "react";

export function useTypedText(
  text: string | null,
  reducedMotion: boolean
): string {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      return;
    }

    if (reducedMotion) {
      setDisplayedText(text);
      return;
    }

    setDisplayedText("");
    const intervalMs = Math.max(6, Math.min(18, 2500 / text.length));
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setDisplayedText(text.slice(0, index));
      if (index >= text.length) window.clearInterval(interval);
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [reducedMotion, text]);

  return displayedText;
}
