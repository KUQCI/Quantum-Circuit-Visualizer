"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { KeyRound, Send, Settings, Trash2, X } from "lucide-react";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { getLessonById } from "@/lib/learning/lessons";
import { getLevelFromXp, getLevelTitle } from "@/lib/learning/progress";
import { buildPageContext } from "@/lib/quanta-chat/context";
import {
  askGemini,
  buildRequestBody,
  canSend,
  DEFAULT_GEMINI_API_KEY,
  GeminiError,
  MAX_QUESTION_CHARS,
  resolveApiKey,
} from "@/lib/quanta-chat/gemini";
import { useCircuitStore } from "@/store/circuit-store";
import { useProgressStore } from "@/store/progress-store";
import { useQuantaChatStore } from "@/store/quanta-chat-store";
import { cn } from "@/lib/utils";

const STARTERS = [
  "What does this page do?",
  "Explain my circuit",
  "What is superposition?",
];

function isAbortError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "AbortError"
  );
}

export function QuantaChat() {
  const pathname = usePathname();
  const path = pathname || "/";
  const circuit = useCircuitStore((state) => state.circuit);
  const totalXp = useProgressStore((state) => state.totalXp);
  const apiKey = useQuantaChatStore((state) => state.apiKey);
  const open = useQuantaChatStore((state) => state.open);
  const messages = useQuantaChatStore((state) => state.messages);
  const pending = useQuantaChatStore((state) => state.pending);
  const error = useQuantaChatStore((state) => state.error);
  const usage = useQuantaChatStore((state) => state.usage);
  const lastSentAt = useQuantaChatStore((state) => state.lastSentAt);
  const setApiKey = useQuantaChatStore((state) => state.setApiKey);
  const clearApiKey = useQuantaChatStore((state) => state.clearApiKey);
  const setOpen = useQuantaChatStore((state) => state.setOpen);
  const addMessage = useQuantaChatStore((state) => state.addMessage);
  const setPending = useQuantaChatStore((state) => state.setPending);
  const setError = useQuantaChatStore((state) => state.setError);
  const addUsage = useQuantaChatStore((state) => state.addUsage);
  const clearMessages = useQuantaChatStore((state) => state.clearMessages);
  const removeMessage = useQuantaChatStore((state) => state.removeMessage);
  const markSent = useQuantaChatStore((state) => state.markSent);
  const [keyDraft, setKeyDraft] = useState("");
  const [editingKey, setEditingKey] = useState(false);
  const [text, setText] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const keyInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const effectiveKey = resolveApiKey(apiKey);
  const showKeyForm = !effectiveKey || editingKey;

  const lesson = useMemo(() => {
    const match = path.match(/^\/learn\/([^/]+)$/);
    return match ? getLessonById(match[1]) : undefined;
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const focus = window.setTimeout(() => {
      if (showKeyForm) {
        keyInputRef.current?.focus();
      } else {
        textareaRef.current?.focus();
      }
    }, 0);
    return () => window.clearTimeout(focus);
  }, [editingKey, open, showKeyForm]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditingKey(false);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  if (!open) return null;

  const rateLimited = !canSend(lastSentAt, now);

  const saveKey = () => {
    if (!keyDraft.trim()) return;
    setApiKey(keyDraft);
    setKeyDraft("");
    setEditingKey(false);
  };

  const send = async (value = text) => {
    const userText = value.trim();
    if (
      !userText ||
      userText.length > MAX_QUESTION_CHARS ||
      pending ||
      !effectiveKey ||
      rateLimited
    ) {
      return;
    }
    const history = messages.map(({ role, text: messageText }) => ({
      role,
      text: messageText,
    }));
    setText("");
    setError(null);
    const userMessageId = addMessage({ role: "user", text: userText });
    markSent();
    setPending(true);
    const gen = useQuantaChatStore.getState().generation;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const context = buildPageContext({
        path,
        circuit,
        lessonTitle: lesson?.title,
        lessonObjective: lesson?.description,
        level: getLevelFromXp(totalXp),
        levelTitle: getLevelTitle(getLevelFromXp(totalXp)),
      });
      const response = await askGemini(
        effectiveKey,
        buildRequestBody({ context, history, userText }),
        fetch,
        controller.signal
      );
      if (useQuantaChatStore.getState().generation !== gen) return;
      addMessage({ role: "quanta", text: response.text });
      addUsage(response.promptTokens, response.outputTokens);
    } catch (caught) {
      if (isAbortError(caught)) return;
      if (useQuantaChatStore.getState().generation !== gen) return;
      removeMessage(userMessageId);
      setText(userText);
      setError(
        caught instanceof GeminiError
          ? caught.userMessage
          : "Couldn't reach Gemini. Check your connection."
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setPending(false);
    }
  };

  const clearChat = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    clearMessages();
    setText("");
  };

  return (
    <section
      aria-label="Chat with Quanta"
      className="fixed bottom-3 right-3 z-[47] flex max-h-[70vh] w-[min(420px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] shadow-2xl sm:bottom-4 sm:right-4 max-[639px]:bottom-0 max-[639px]:right-0 max-[639px]:w-full max-[639px]:rounded-b-none"
    >
      <header className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2.5">
        <QuantaImage variant="empty" size="xs" bare alt="Quanta" />
        <h2 className="min-w-0 flex-1 text-sm font-semibold">Chat with Quanta</h2>
        <button
          type="button"
          onClick={() => {
            setKeyDraft("");
            setEditingKey(true);
          }}
          className="rounded-md p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          aria-label="Chat key settings"
          title="Chat key settings"
        >
          <Settings className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            setEditingKey(false);
            setOpen(false);
          }}
          className="rounded-md p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </header>

      {showKeyForm ? (
        <div className="space-y-3 overflow-y-auto p-4 text-sm">
          <p>
            {DEFAULT_GEMINI_API_KEY
              ? "Quanta uses a shared Gemini key by default. Paste your own Google Gemini API key to use your own quota. It is stored only in this browser and sent only to Google."
              : "Paste your own Google Gemini API key. It is stored only in this browser and sent only to Google."}
          </p>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener"
            className="text-[var(--color-brand)] underline underline-offset-2"
          >
            Get a Gemini API key
          </a>
          <label className="block">
            <span className="sr-only">Gemini API key</span>
            <input
              ref={keyInputRef}
              type="password"
              value={keyDraft}
              onChange={(event) => setKeyDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") saveKey();
              }}
              placeholder="AIza..."
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 outline-none focus:border-[var(--color-brand)]"
            />
          </label>
          <button
            type="button"
            onClick={saveKey}
            disabled={!keyDraft.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4" aria-hidden />
            Save key
          </button>
          {effectiveKey && (
            <button
              type="button"
              onClick={() => {
                setKeyDraft("");
                setEditingKey(false);
              }}
              className="ml-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
            >
              Back to chat
            </button>
          )}
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Free keys are rate-limited; Quanta keeps replies short to save
            quota.
          </p>
          {apiKey && (
            <button
              type="button"
              onClick={() => {
                clearApiKey();
                setEditingKey(false);
              }}
              className="text-xs text-[var(--color-destructive)] underline underline-offset-2"
            >
              Remove key
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3"
            aria-live="polite"
            role="log"
          >
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Ask about this page or your circuit.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => void send(starter)}
                      disabled={pending || rateLimited}
                      className="rounded-full border border-[var(--color-border)] px-2.5 py-1.5 text-xs hover:border-[var(--color-brand)] disabled:opacity-50"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[88%] rounded-xl px-3 py-2 text-sm",
                  message.role === "user"
                    ? "ml-auto bg-[var(--color-brand)] text-white"
                    : "mr-auto bg-[var(--color-muted)]"
                )}
              >
                {message.text}
              </div>
            ))}
            {pending && (
              <div className="mr-auto rounded-xl bg-[var(--color-muted)] px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
                Quanta is thinking…
              </div>
            )}
          </div>
          {error && (
            <p role="alert" className="px-3 text-xs text-[var(--color-destructive)]">
              {error}
            </p>
          )}
          <div className="space-y-2 border-t border-[var(--color-border)] p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={text}
                maxLength={MAX_QUESTION_CHARS}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                placeholder="Ask Quanta…"
                className="min-h-10 flex-1 resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)]"
              />
              {text.length >= 400 && (
                <span className="pb-2 text-[11px] text-[var(--color-muted-foreground)]">
                  {text.length}/{MAX_QUESTION_CHARS}
                </span>
              )}
              <button
                type="button"
                onClick={() => void send()}
                disabled={pending || !text.trim() || rateLimited}
                className="rounded-lg bg-[var(--color-brand)] p-2.5 text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--color-muted-foreground)]">
              <span>
                ~{usage.promptTokens + usage.outputTokens} tokens ·{" "}
                {usage.requests} requests this session
              </span>
              <button
                type="button"
                onClick={clearChat}
                className="inline-flex shrink-0 items-center gap-1 hover:text-[var(--color-foreground)]"
              >
                <Trash2 className="h-3 w-3" aria-hidden />
                Clear chat
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
