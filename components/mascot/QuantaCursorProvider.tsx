"use client";

import { useEffect } from "react";
import { getQuantaAssetUrl } from "@/lib/quanta-assets";
import { useThemeStore } from "@/store/theme-store";

export function QuantaCursorProvider() {
  const enabled = useThemeStore((state) => state.quantaCursor);

  useEffect(() => {
    const root = document.documentElement;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!enabled || !finePointer) {
      root.removeAttribute("data-quanta-cursor");
      root.style.removeProperty("--quanta-cursor");
      root.style.removeProperty("--quanta-cursor-pointer");
      return;
    }
    root.dataset.quantaCursor = "on";
    root.style.setProperty(
      "--quanta-cursor",
      `url(${getQuantaAssetUrl("cursorDefault")}) 4 4, auto`
    );
    root.style.setProperty(
      "--quanta-cursor-pointer",
      `url(${getQuantaAssetUrl("cursorPointer")}) 6 2, pointer`
    );
    return () => {
      root.removeAttribute("data-quanta-cursor");
      root.style.removeProperty("--quanta-cursor");
      root.style.removeProperty("--quanta-cursor-pointer");
    };
  }, [enabled]);

  return null;
}
