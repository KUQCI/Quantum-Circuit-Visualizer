"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/store/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("qiskit-visualizer-theme");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const t = parsed?.state?.theme ?? "dark";
        document.documentElement.setAttribute("data-theme", t);
        document.documentElement.classList.toggle("dark", t === "dark");
      } catch {
        /* use default */
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, mounted]);

  return <>{children}</>;
}
