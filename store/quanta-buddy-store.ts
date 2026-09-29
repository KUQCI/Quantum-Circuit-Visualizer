"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeJsonStorage } from "@/lib/safe-persist";

interface QuantaBuddyState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  callRequest: number;
  callQuanta: () => void;
}

export const useQuantaBuddyStore = create<QuantaBuddyState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
      toggle: () => set((state) => ({ enabled: !state.enabled })),
      callRequest: 0,
      callQuanta: () => set((state) => ({ callRequest: state.callRequest + 1 })),
    }),
    {
      name: "qci-quanta-buddy",
      storage: createSafeJsonStorage<Pick<QuantaBuddyState, "enabled">>(),
      partialize: (state) => ({ enabled: state.enabled }),
    }
  )
);
