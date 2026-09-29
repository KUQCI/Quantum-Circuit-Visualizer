"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeJsonStorage } from "@/lib/safe-persist";

interface QuantaBuddyState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  sound: boolean;
  toggleSound: () => void;
  callRequest: number;
  callQuanta: () => void;
}

export const useQuantaBuddyStore = create<QuantaBuddyState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
      toggle: () => set((state) => ({ enabled: !state.enabled })),
      sound: true,
      toggleSound: () => set((state) => ({ sound: !state.sound })),
      callRequest: 0,
      callQuanta: () => set((state) => ({ callRequest: state.callRequest + 1 })),
    }),
    {
      name: "qci-quanta-buddy",
      storage:
        createSafeJsonStorage<Pick<QuantaBuddyState, "enabled" | "sound">>(),
      partialize: (state) => ({ enabled: state.enabled, sound: state.sound }),
    }
  )
);
