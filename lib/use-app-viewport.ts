"use client";

import { useEffect } from "react";

/** Sync real visual viewport height (mobile URL bar aware) to --app-vh. */
export function useAppViewportHeight(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      document.documentElement.style.removeProperty("--app-vh");
      return;
    }

    const update = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-vh", `${Math.round(h)}px`);
    };

    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      document.documentElement.style.removeProperty("--app-vh");
    };
  }, [enabled]);
}
