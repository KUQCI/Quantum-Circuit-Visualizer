import { create } from "zustand";
import type { QuantaVariant } from "@/lib/quanta-assets";

export interface QuantaPopoutMessage {
  id: number;
  text: string;
  title?: string;
  variant: "default" | "success" | "hint" | "error";
  imageVariant?: QuantaVariant;
}

interface QuantaPopoutState {
  message: QuantaPopoutMessage | null;
  say: (
    message: Omit<QuantaPopoutMessage, "id">
  ) => void;
  dismiss: () => void;
}

let nextMessageId = 0;

export const useQuantaPopoutStore = create<QuantaPopoutState>((set) => ({
  message: null,
  say: (message) =>
    set({
      message: {
        ...message,
        id: ++nextMessageId,
      },
    }),
  dismiss: () => set({ message: null }),
}));
