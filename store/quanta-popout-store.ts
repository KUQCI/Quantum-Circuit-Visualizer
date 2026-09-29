import { create } from "zustand";
import type { QuantaVariant } from "@/lib/quanta-assets";

export interface QuantaPopoutMessage {
  id: number;
  updatedAt: number;
  text: string;
  title?: string;
  variant: "default" | "success" | "hint" | "error";
  imageVariant?: QuantaVariant;
}

interface QuantaPopoutState {
  message: QuantaPopoutMessage | null;
  buddySpeaking: boolean;
  say: (
    message: Omit<QuantaPopoutMessage, "id" | "updatedAt">
  ) => void;
  dismiss: () => void;
  setBuddySpeaking: (speaking: boolean) => void;
}

let nextMessageId = 0;

export const useQuantaPopoutStore = create<QuantaPopoutState>((set) => ({
  message: null,
  buddySpeaking: false,
  say: (message) =>
    set({
      message: {
        ...message,
        id: ++nextMessageId,
        updatedAt: Date.now(),
      },
    }),
  dismiss: () => set({ message: null }),
  setBuddySpeaking: (buddySpeaking) => set({ buddySpeaking }),
}));
