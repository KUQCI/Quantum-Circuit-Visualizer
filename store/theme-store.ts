"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeJsonStorage } from "@/lib/safe-persist";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === "dark" ? "light" : "dark" }),
    }),
    { name: "qiskit-visualizer-theme", storage: createSafeJsonStorage<Pick<ThemeState, "theme">>() }
  )
);

export function getMonacoTheme(theme: Theme): "vs" | "vs-dark" {
  return theme === "dark" ? "vs-dark" : "vs";
}
