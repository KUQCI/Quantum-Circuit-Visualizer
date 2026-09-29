import { QUANTA_SYSTEM_PROMPT } from "@/lib/quanta-chat/system-prompt";
import { toPlainMath } from "@/lib/quanta-chat/plain-math";

export const GEMINI_MODEL = "gemini-3.5-flash-lite";
/** Used when GEMINI_MODEL returns 404 for the visitor's key. */
export const GEMINI_FALLBACK_MODEL = "gemini-2.5-flash-lite";
export const MAX_QUESTION_CHARS = 500;
export const DEFAULT_GEMINI_API_KEY =
  process.env.NEXT_PUBLIC_QUANTA_GEMINI_API_KEY?.trim() ?? "";

export function resolveApiKey(
  userKey: string,
  defaultKey: string = DEFAULT_GEMINI_API_KEY
): string {
  return userKey || defaultKey;
}
export const GEMINI_ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

interface GeminiHistoryMessage {
  role: "user" | "quanta";
  text: string;
}

export interface GeminiRequestInput {
  context: string;
  history: GeminiHistoryMessage[];
  userText: string;
}

export function buildRequestBody({
  context,
  history,
  userText,
}: GeminiRequestInput) {
  const contents = history.slice(-6).map((message) => ({
    role: message.role === "quanta" ? "model" : "user",
    parts: [{ text: message.text.slice(0, 400) }],
  }));
  contents.push({
    role: "user",
    parts: [
      {
        text: `PAGE CONTEXT:\n${context}\n\nQUESTION: ${userText.trim().slice(0, MAX_QUESTION_CHARS)}`,
      },
    ],
  });
  return {
    systemInstruction: { parts: [{ text: QUANTA_SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      maxOutputTokens: 220,
      temperature: 0.6,
      thinkingConfig: { thinkingLevel: "minimal" },
    },
  };
}

export interface GeminiResponse {
  text: string;
  promptTokens: number;
  outputTokens: number;
}

export function parseGeminiResponse(json: unknown): GeminiResponse {
  const value = json as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    promptFeedback?: { blockReason?: string };
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
    };
  };
  const candidate = value.candidates?.[0];
  const text =
    candidate?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("") ?? "";
  if (!text && value.promptFeedback?.blockReason) {
    return {
      text: "I can't answer that one.",
      promptTokens: value.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: value.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }
  if (!candidate) {
    throw new Error("Gemini returned no candidates.");
  }
  return {
    text: toPlainMath(text),
    promptTokens: value.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: value.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

export class GeminiError extends Error {
  userMessage: string;

  constructor(userMessage: string) {
    super(userMessage);
    this.name = "GeminiError";
    this.userMessage = userMessage;
  }
}

function isAbortError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "AbortError"
  );
}

type GeminiRequestBody = ReturnType<typeof buildRequestBody>;

function payloadForModel(body: GeminiRequestBody, model: string) {
  if (model === GEMINI_MODEL) return body;
  return {
    ...body,
    generationConfig: {
      ...body.generationConfig,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
}

export async function askGemini(
  apiKey: string,
  body: GeminiRequestBody,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal
): Promise<GeminiResponse> {
  const post = async (model: string) => {
    try {
      return await fetchImpl(GEMINI_ENDPOINT(model), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payloadForModel(body, model)),
        signal,
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new GeminiError("Couldn't reach Gemini. Check your connection.");
    }
  };

  let response = await post(GEMINI_MODEL);
  if (response.status === 404) {
    response = await post(GEMINI_FALLBACK_MODEL);
  }

  if (!response.ok) {
    const message =
      response.status === 400 || response.status === 403
        ? "That key was rejected. Check it in the key settings."
        : response.status === 429
          ? "Quota reached for now — try again in a minute."
          : response.status === 404
            ? "Model unavailable."
            : `Gemini error ${response.status}`;
    throw new GeminiError(message);
  }

  try {
    return parseGeminiResponse(await response.json());
  } catch (error) {
    if (isAbortError(error)) throw error;
    if (error instanceof GeminiError) throw error;
    throw new GeminiError("Gemini returned an invalid response.");
  }
}

export function canSend(lastSentAt: number, now = Date.now()): boolean {
  return now - lastSentAt >= 3000;
}
