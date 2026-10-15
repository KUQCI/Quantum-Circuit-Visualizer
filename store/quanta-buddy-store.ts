"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeJsonStorage } from "@/lib/safe-persist";
import type { HatId, SkinId } from "@/lib/quanta-buddy/wardrobe";

interface QuantaBuddyState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  sound: boolean;
  toggleSound: () => void;
  hat: HatId | null;
  setHat: (hat: HatId | null) => void;
  skin: SkinId;
  setSkin: (skin: SkinId) => void;
  callRequest: number;
  keyboardCallRequest: number;
  callQuanta: (keyboardInitiated?: boolean) => void;
}

export const useQuantaBuddyStore = create<QuantaBuddyState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
      toggle: () => set((state) => ({ enabled: !state.enabled })),
      sound: true,
      toggleSound: () => set((state) => ({ sound: !state.sound })),
      hat: null,
      setHat: (hat) => set({ hat }),
      skin: "classic",
      setSkin: (skin) => set({ skin }),
      callRequest: 0,
      keyboardCallRequest: 0,
      callQuanta: (keyboardInitiated = false) =>
        set((state) => {
          const callRequest = state.callRequest + 1;
          return {
            callRequest,
            keyboardCallRequest: keyboardInitiated
              ? callRequest
              : state.keyboardCallRequest,
          };
        }),
    }),
    {
      name: "qci-quanta-buddy",
      storage:
        createSafeJsonStorage<
          Pick<QuantaBuddyState, "enabled" | "sound" | "hat" | "skin">
        >(),
      partialize: (state) => ({
        enabled: state.enabled,
        sound: state.sound,
        hat: state.hat,
        skin: state.skin,
      }),
    }
  )
);
