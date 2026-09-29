import { describe, expect, it } from "vitest";
import {
  askGemini,
  buildRequestBody,
  canSend,
  GeminiError,
  MAX_QUESTION_CHARS,
  parseGeminiResponse,
} from "@/lib/quanta-chat/gemini";

describe("Quanta Gemini helpers", () => {
  it("caps history and puts context only on the final turn", () => {
    const body = buildRequestBody({
      context: "Page: Build",
      history: Array.from({ length: 8 }, (_, index) => ({
        role: index % 2 === 0 ? "user" : "quanta",
        text: `${index} ${"x".repeat(500)}`,
      })),
      userText: "  Explain this  ",
    });

    expect(body.contents).toHaveLength(7);
    expect(body.contents[0]?.parts[0]?.text).toContain("2 ");
    expect(body.contents[0]?.parts[0]?.text).toHaveLength(400);
    expect(body.contents.slice(0, -1).every((turn) => !turn.parts[0].text.includes("Page: Build"))).toBe(true);
    expect(body.contents.at(-1)?.parts[0]?.text).toContain(
      "PAGE CONTEXT:\nPage: Build\n\nQUESTION: Explain this"
    );
    expect(body.generationConfig).toMatchObject({
      maxOutputTokens: 220,
      temperature: 0.6,
      thinkingConfig: { thinkingBudget: 0 },
    });
  });

  it("parses text and usage metadata", () => {
    expect(
      parseGeminiResponse({
        candidates: [
          {
            content: {
              parts: [{ text: "Hello " }, { text: "there." }],
            },
          },
        ],
        usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 7 },
      })
    ).toEqual({ text: "Hello there.", promptTokens: 12, outputTokens: 7 });
  });

  it("uses a safe response for blocked content", () => {
    expect(
      parseGeminiResponse({
        promptFeedback: { blockReason: "SAFETY" },
        usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 0 },
      })
    ).toEqual({
      text: "I can't answer that one.",
      promptTokens: 4,
      outputTokens: 0,
    });
    expect(
      parseGeminiResponse({
        candidates: [{ content: { parts: [] } }],
        promptFeedback: { blockReason: "SAFETY" },
      }).text
    ).toBe("I can't answer that one.");
    expect(() => parseGeminiResponse({ candidates: [] })).toThrow();
  });

  it("maps HTTP and network errors", async () => {
    const body = buildRequestBody({ context: "", history: [], userText: "Hi" });
    for (const [status, message] of [
      [400, "That key was rejected. Check it in the key settings."],
      [429, "Quota reached for now — try again in a minute."],
    ] as const) {
      await expect(
        askGemini("test", body, async () => new Response(null, { status }))
      ).rejects.toMatchObject({ userMessage: message });
    }
    await expect(
      askGemini("test", body, async () => {
        throw new Error("offline");
      })
    ).rejects.toBeInstanceOf(GeminiError);
  });

  it("rethrows aborts without converting them to GeminiError", async () => {
    const body = buildRequestBody({ context: "", history: [], userText: "Hi" });
    const controller = new AbortController();
    const abort = new DOMException("Aborted", "AbortError");

    await expect(
      askGemini(
        "test",
        body,
        async (_input, init) => {
          expect(init?.signal).toBe(controller.signal);
          throw abort;
        },
        controller.signal
      )
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(abort).not.toBeInstanceOf(GeminiError);
  });

  it("exports the defensive question limit", () => {
    expect(MAX_QUESTION_CHARS).toBe(500);
  });

  it("enforces a three-second client rate limit", () => {
    expect(canSend(10_000, 12_999)).toBe(false);
    expect(canSend(10_000, 13_000)).toBe(true);
  });
});
