import { beforeEach, describe, expect, it } from "vitest";
import { useQuantaChatStore } from "@/store/quanta-chat-store";

describe("Quanta chat store", () => {
  beforeEach(() => {
    useQuantaChatStore.setState({
      apiKey: "",
      open: false,
      messages: [],
      pending: false,
      error: null,
      usage: { promptTokens: 0, outputTokens: 0, requests: 0 },
      lastSentAt: 0,
    });
  });

  it("caps messages at 40 entries", () => {
    for (let i = 0; i < 45; i++) {
      useQuantaChatStore.getState().addMessage({
        role: "user",
        text: `Message ${i}`,
      });
    }

    const messages = useQuantaChatStore.getState().messages;
    expect(messages).toHaveLength(40);
    expect(messages[0]?.text).toBe("Message 5");
    expect(messages.at(-1)?.text).toBe("Message 44");
  });

  it("persists only the API key", () => {
    const state = useQuantaChatStore.getState();
    const partialize = useQuantaChatStore.persist.getOptions().partialize;

    expect(
      partialize?.({
        ...state,
        apiKey: "test-key",
        open: true,
        messages: [{ id: 1, role: "user", text: "secret question" }],
      })
    ).toEqual({ apiKey: "test-key" });
  });

  it("accumulates usage and request count", () => {
    useQuantaChatStore.getState().addUsage(8, 5);
    useQuantaChatStore.getState().addUsage(3, 7);

    expect(useQuantaChatStore.getState().usage).toEqual({
      promptTokens: 11,
      outputTokens: 12,
      requests: 2,
    });
  });

  it("clears messages without resetting session usage", () => {
    useQuantaChatStore.getState().addMessage({ role: "user", text: "Keep usage" });
    useQuantaChatStore.getState().addUsage(2, 3);
    useQuantaChatStore.getState().clearMessages();

    expect(useQuantaChatStore.getState().messages).toEqual([]);
    expect(useQuantaChatStore.getState().usage.requests).toBe(1);
  });
});
