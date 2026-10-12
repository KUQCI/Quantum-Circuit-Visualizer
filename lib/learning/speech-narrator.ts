export interface SpeechNarrator {
  supported: boolean;
  speak(text: string, onDone: () => void): void;
  cancel(): void;
}

export function createSpeechNarrator(
  synth: SpeechSynthesis | null,
  makeUtterance = (text: string) => new SpeechSynthesisUtterance(text)
): SpeechNarrator {
  let token = 0;

  return {
    supported: synth !== null,
    speak(text, onDone) {
      if (!synth) return;

      const currentToken = ++token;
      synth.cancel();
      const utterance = makeUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.pitch = 1.1;

      const englishVoice = synth
        .getVoices()
        .find((voice) => voice.lang.toLowerCase().startsWith("en"));
      if (englishVoice) utterance.voice = englishVoice;

      let finished = false;
      const finish = () => {
        if (finished || currentToken !== token) return;
        finished = true;
        onDone();
      };

      utterance.onend = finish;
      utterance.onerror = finish;
      synth.speak(utterance);
    },
    cancel() {
      token += 1;
      synth?.cancel();
    },
  };
}
