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
      generation: 0,
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

  it("returns message ids and removes messages", () => {
    const firstId = useQuantaChatStore.getState().addMessage({
      role: "user",
      text: "Remove me",
    });
    const secondId = useQuantaChatStore.getState().addMessage({
      role: "quanta",
      text: "Keep me",
    });

    expect(firstId).toEqual(expect.any(Number));
    useQuantaChatStore.getState().removeMessage(firstId);
    expect(useQuantaChatStore.getState().messages.map((message) => message.id)).toEqual([
      secondId,
    ]);
  });

  it("increments generation when clearing messages", () => {
    const before = useQuantaChatStore.getState().generation;
    useQuantaChatStore.getState().clearMessages();
    expect(useQuantaChatStore.getState().generation).toBe(before + 1);
  });
});
