import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createClipNarrator,
  createSpeechNarrator,
  type SpeechNarrator,
} from "@/lib/learning/speech-narrator";

interface FakeUtterance {
  text: string;
  lang: string;
  rate: number;
  pitch: number;
  voice: SpeechSynthesisVoice | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function createFakeSynth(voices: SpeechSynthesisVoice[] = []) {
  const utterances: FakeUtterance[] = [];
  const synth = {
    cancel: vi.fn(),
    getVoices: vi.fn(() => voices),
    speak: vi.fn((utterance: FakeUtterance) => {
      utterances.push(utterance);
    }),
  } as unknown as SpeechSynthesis;

  const makeUtterance = (text: string) => {
    const utterance: FakeUtterance = {
      text,
      lang: "",
      rate: 0,
      pitch: 0,
      voice: null,
      onend: null,
      onerror: null,
    };
    return utterance as unknown as SpeechSynthesisUtterance;
  };

  return { synth, utterances, makeUtterance };
}

interface FakeAudio {
  onended: (() => void) | null;
  onerror: (() => void) | null;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
}

function createFakeAudio(
  play = vi.fn(() => Promise.resolve())
): FakeAudio {
  return {
    onended: null,
    onerror: null,
    play,
    pause: vi.fn(),
  };
}

function createFakeFallback(supported = true): SpeechNarrator {
  return {
    supported,
    speak: vi.fn(),
    cancel: vi.fn(),
  };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("createSpeechNarrator", () => {
  it("sets voice preferences and completes a spoken scene once", () => {
    const voices = [
      { lang: "fr-FR" },
      { lang: "en-GB" },
    ] as SpeechSynthesisVoice[];
    const { synth, utterances, makeUtterance } = createFakeSynth(voices);
    const narrator = createSpeechNarrator(synth, makeUtterance);
    const onDone = vi.fn();

    narrator.speak("A short scene.", onDone);

    expect(narrator.supported).toBe(true);
    expect(synth.cancel).toHaveBeenCalledOnce();
    expect(utterances[0]).toMatchObject({
      text: "A short scene.",
      lang: "en-US",
      rate: 1,
      pitch: 1.1,
      voice: voices[1],
    });
    utterances[0].onend?.();
    utterances[0].onerror?.();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("ignores stale completion after cancellation", () => {
    const { synth, utterances, makeUtterance } = createFakeSynth();
    const narrator = createSpeechNarrator(synth, makeUtterance);
    const onDone = vi.fn();

    narrator.speak("Cancel me.", onDone);
    narrator.cancel();
    utterances[0].onend?.();
    utterances[0].onerror?.();

    expect(synth.cancel).toHaveBeenCalledTimes(2);
    expect(onDone).not.toHaveBeenCalled();
  });

  it("ignores an earlier utterance when a newer one replaces it", () => {
    const { synth, utterances, makeUtterance } = createFakeSynth();
    const narrator = createSpeechNarrator(synth, makeUtterance);
    const firstDone = vi.fn();
    const secondDone = vi.fn();

    narrator.speak("First.", firstDone);
    narrator.speak("Second.", secondDone);
    utterances[0].onend?.();
    utterances[1].onend?.();

    expect(firstDone).not.toHaveBeenCalled();
    expect(secondDone).toHaveBeenCalledOnce();
  });

  it("does nothing when speech synthesis is unavailable", () => {
    const narrator = createSpeechNarrator(null);

    expect(narrator.supported).toBe(false);
    expect(() => narrator.speak("Captions only.", vi.fn())).not.toThrow();
    expect(() => narrator.cancel()).not.toThrow();
  });
});

describe("createClipNarrator", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onDone once when the clip ends", async () => {
    const fallback = createFakeFallback();
    const audio = createFakeAudio();
    const makeAudio = vi.fn(() => audio as unknown as HTMLAudioElement);
    const narrator = createClipNarrator({
      fallback,
      resolveClipUrl: async () => "/speech.mp3",
      makeAudio,
    });
    const onDone = vi.fn();

    narrator.speak("A clip.", onDone);
    await flushMicrotasks();
    audio.onended?.();
    audio.onended?.();

    expect(narrator.supported).toBe(true);
    expect(makeAudio).toHaveBeenCalledWith("/speech.mp3");
    expect(audio.play).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("falls back when the clip reports an error", async () => {
    const fallback = createFakeFallback();
    const audio = createFakeAudio();
    const narrator = createClipNarrator({
      fallback,
      resolveClipUrl: async () => "/speech.mp3",
      makeAudio: () => audio as unknown as HTMLAudioElement,
    });

    narrator.speak("Try fallback.", vi.fn());
    await flushMicrotasks();
    audio.onerror?.();

    expect(fallback.speak).toHaveBeenCalledWith(
      "Try fallback.",
      expect.any(Function)
    );
  });

  it("falls back when play rejects", async () => {
    const fallback = createFakeFallback();
    const audio = createFakeAudio(
      vi.fn(() => Promise.reject(new Error("play failed")))
    );
    const narrator = createClipNarrator({
      fallback,
      resolveClipUrl: async () => "/speech.mp3",
      makeAudio: () => audio as unknown as HTMLAudioElement,
    });

    narrator.speak("Try fallback.", vi.fn());
    await flushMicrotasks();

    expect(fallback.speak).toHaveBeenCalledWith(
      "Try fallback.",
      expect.any(Function)
    );
  });

  it("falls back when there is no clip URL", async () => {
    const fallback = createFakeFallback();
    const makeAudio = vi.fn();
    const narrator = createClipNarrator({
      fallback,
      resolveClipUrl: async () => null,
      makeAudio,
    });

    narrator.speak("No clip.", vi.fn());
    await flushMicrotasks();

    expect(fallback.speak).toHaveBeenCalledWith(
      "No clip.",
      expect.any(Function)
    );
    expect(makeAudio).not.toHaveBeenCalled();
  });

  it("does not create audio when cancelled during URL resolution", async () => {
    let resolveUrl!: (url: string | null) => void;
    const resolveClipUrl = vi.fn(
      () =>
        new Promise<string | null>((resolve) => {
          resolveUrl = resolve;
        })
    );
    const makeAudio = vi.fn();
    const narrator = createClipNarrator({
      fallback: createFakeFallback(),
      resolveClipUrl,
      makeAudio,
    });

    narrator.speak("Cancel lookup.", vi.fn());
    narrator.cancel();
    resolveUrl("/speech.mp3");
    await flushMicrotasks();

    expect(resolveClipUrl).toHaveBeenCalledWith("Cancel lookup.");
    expect(makeAudio).not.toHaveBeenCalled();
  });

  it("ignores an ended event from an earlier clip", async () => {
    const fallback = createFakeFallback();
    const firstAudio = createFakeAudio();
    const secondAudio = createFakeAudio();
    const audios = [firstAudio, secondAudio];
    const narrator = createClipNarrator({
      fallback,
      resolveClipUrl: async () => "/speech.mp3",
      makeAudio: () => audios.shift() as unknown as HTMLAudioElement,
    });
    const firstDone = vi.fn();
    const secondDone = vi.fn();

    narrator.speak("First.", firstDone);
    await flushMicrotasks();
    const staleEnded = firstAudio.onended;
    narrator.speak("Second.", secondDone);
    await flushMicrotasks();
    staleEnded?.();
    secondAudio.onended?.();

    expect(firstDone).not.toHaveBeenCalled();
    expect(secondDone).toHaveBeenCalledOnce();
  });

  it("uses a delay when both the clip and fallback voice are unavailable", async () => {
    vi.useFakeTimers();
    const narrator = createClipNarrator({
      fallback: createFakeFallback(false),
      resolveClipUrl: async () => null,
      fallbackDelayMs: () => 2000,
    });
    const onDone = vi.fn();

    narrator.speak("Wait briefly.", onDone);
    await flushMicrotasks();
    vi.advanceTimersByTime(1999);
    expect(onDone).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(onDone).toHaveBeenCalledOnce();
  });
});
