export interface SpeechNarrator {
  supported: boolean;
  speak(text: string, onDone: () => void): void;
  cancel(): void;
}

export function createClipNarrator({
  fallback,
  resolveClipUrl,
  makeAudio = (url) => new Audio(url),
  fallbackDelayMs = (text) => Math.max(2000, text.length * 60),
}: {
  fallback: SpeechNarrator;
  resolveClipUrl: (text: string) => Promise<string | null>;
  makeAudio?: (url: string) => HTMLAudioElement;
  fallbackDelayMs?: (text: string) => number;
}): SpeechNarrator {
  let token = 0;
  let audio: HTMLAudioElement | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stopAudio = () => {
    if (!audio) return;
    const currentAudio = audio;
    audio = null;
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
  };

  const clearTimer = () => {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
  };

  return {
    supported: true,
    speak(text, onDone) {
      const currentToken = ++token;
      stopAudio();
      clearTimer();
      fallback.cancel();

      let failedOver = false;
      let finished = false;
      const isCurrent = () => currentToken === token;
      const finish = () => {
        if (!isCurrent() || finished) return;
        finished = true;
        stopAudio();
        clearTimer();
        onDone();
      };
      const failover = () => {
        if (!isCurrent() || failedOver || finished) return;
        failedOver = true;
        stopAudio();
        if (fallback.supported) {
          fallback.speak(text, finish);
        } else {
          timer = setTimeout(finish, fallbackDelayMs(text));
        }
      };

      let clipUrl: Promise<string | null>;
      try {
        clipUrl = Promise.resolve(resolveClipUrl(text));
      } catch {
        failover();
        return;
      }

      void clipUrl
        .then((url) => {
          if (!isCurrent()) return;
          if (!url) {
            failover();
            return;
          }

          let clipAudio: HTMLAudioElement;
          try {
            clipAudio = makeAudio(url);
          } catch {
            failover();
            return;
          }
          audio = clipAudio;
          clipAudio.onended = finish;
          clipAudio.onerror = failover;

          try {
            void clipAudio.play().catch(failover);
          } catch {
            failover();
          }
        })
        .catch(failover);
    },
    cancel() {
      token += 1;
      stopAudio();
      clearTimer();
      fallback.cancel();
    },
  };
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
