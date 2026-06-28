"use client";

import { useEffect, useState } from "react";

/** Subscribe to a CSS media query; updates on viewport changes and orientation. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Below Tailwind `lg` — phone and tablet portrait layouts. */
export const COMPACT_VIEWPORT_QUERY = "(max-width: 1023px)";
