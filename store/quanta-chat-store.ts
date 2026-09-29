"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeJsonStorage } from "@/lib/safe-persist";

export interface ChatMessage {
  id: number;
  role: "user" | "quanta";
  text: string;
}

export interface ChatUsage {
  promptTokens: number;
  outputTokens: number;
  requests: number;
}

interface QuantaChatState {
  apiKey: string;
  open: boolean;
  messages: ChatMessage[];
  pending: boolean;
  error: string | null;
  usage: ChatUsage;
  lastSentAt: number;
  setApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  addMessage: (message: Omit<ChatMessage, "id">) => void;
  setPending: (pending: boolean) => void;
  setError: (error: string | null) => void;
  addUsage: (promptTokens: number, outputTokens: number) => void;
  clearMessages: () => void;
  markSent: (timestamp?: number) => void;
}

let nextMessageId = 1;

export const useQuantaChatStore = create<QuantaChatState>()(
  persist(
    (set) => ({
      apiKey: "",
      open: false,
      messages: [],
      pending: false,
      error: null,
      usage: { promptTokens: 0, outputTokens: 0, requests: 0 },
      lastSentAt: 0,
      setApiKey: (apiKey) => set({ apiKey: apiKey.trim(), error: null }),
      clearApiKey: () => set({ apiKey: "", error: null }),
      setOpen: (open) => set({ open }),
      toggleOpen: () => set((state) => ({ open: !state.open })),
      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            { ...message, id: nextMessageId++ },
          ].slice(-40),
        })),
      setPending: (pending) => set({ pending }),
      setError: (error) => set({ error }),
      addUsage: (promptTokens, outputTokens) =>
        set((state) => ({
          usage: {
            promptTokens: state.usage.promptTokens + promptTokens,
            outputTokens: state.usage.outputTokens + outputTokens,
            requests: state.usage.requests + 1,
          },
        })),
      clearMessages: () =>
        set({
          messages: [],
          error: null,
        }),
      markSent: (timestamp = Date.now()) => set({ lastSentAt: timestamp }),
    }),
    {
      name: "qci-quanta-chat",
      storage: createSafeJsonStorage<Pick<QuantaChatState, "apiKey">>(),
      partialize: (state) => ({ apiKey: state.apiKey }),
    }
  )
);
