"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeJsonStorage } from "@/lib/safe-persist";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  quantaCursor: boolean;
  setTheme: (theme: Theme) => void;
  setQuantaCursor: (enabled: boolean) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      quantaCursor: true,
      setTheme: (theme) => set({ theme }),
      setQuantaCursor: (enabled) => set({ quantaCursor: enabled }),
      toggleTheme: () =>
        set({ theme: get().theme === "dark" ? "light" : "dark" }),
    }),
    {
      name: "qiskit-visualizer-theme",
      storage: createSafeJsonStorage<Pick<ThemeState, "theme" | "quantaCursor">>(),
    }
  )
);

export function getMonacoTheme(theme: Theme): "vs" | "vs-dark" {
  return theme === "dark" ? "vs-dark" : "vs";
}
