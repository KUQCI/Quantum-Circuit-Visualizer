import { describe, expect, it, vi } from "vitest";
import { createSpeechNarrator } from "@/lib/learning/speech-narrator";

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
