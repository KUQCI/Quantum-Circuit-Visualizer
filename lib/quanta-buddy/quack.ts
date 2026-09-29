"use client";

export type QuackKind = "soft" | "loud" | "pop";

let context: AudioContext | null = null;
let unlocked = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") {
    return null;
  }
  context ??= new AudioContext();
  return context;
}

/** Browsers only allow audio after a user gesture; call this from a pointer handler. */
export function unlockQuacks(): void {
  const audio = getContext();
  if (!audio) return;
  unlocked = true;
  if (audio.state === "suspended") void audio.resume();
}

export function quacksUnlocked(): boolean {
  return unlocked && context?.state === "running";
}

function quackVoice(
  audio: AudioContext,
  startAt: number,
  duration: number,
  pitch: number,
  gain: number
): void {
  const osc = audio.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(pitch * 1.25, startAt);
  osc.frequency.exponentialRampToValueAtTime(pitch, startAt + duration * 0.35);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, startAt + duration);

  const vibrato = audio.createOscillator();
  vibrato.frequency.value = 28;
  const vibratoGain = audio.createGain();
  vibratoGain.gain.value = pitch * 0.08;
  vibrato.connect(vibratoGain).connect(osc.frequency);

  const nasal = audio.createBiquadFilter();
  nasal.type = "bandpass";
  nasal.frequency.setValueAtTime(1200, startAt);
  nasal.frequency.exponentialRampToValueAtTime(700, startAt + duration);
  nasal.Q.value = 2.5;

  const body = audio.createBiquadFilter();
  body.type = "lowpass";
  body.frequency.value = 2600;

  const envelope = audio.createGain();
  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.exponentialRampToValueAtTime(gain, startAt + 0.02);
  envelope.gain.setValueAtTime(gain, startAt + duration * 0.6);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(nasal).connect(body).connect(envelope).connect(audio.destination);
  osc.start(startAt);
  vibrato.start(startAt);
  osc.stop(startAt + duration + 0.05);
  vibrato.stop(startAt + duration + 0.05);
}

function popVoice(audio: AudioContext, startAt: number): void {
  const length = Math.floor(audio.sampleRate * 0.25);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / length) ** 2;
  }
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3000, startAt);
  filter.frequency.exponentialRampToValueAtTime(300, startAt + 0.25);
  const envelope = audio.createGain();
  envelope.gain.setValueAtTime(0.5, startAt);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.25);
  noise.connect(filter).connect(envelope).connect(audio.destination);
  noise.start(startAt);
}

export function playQuack(kind: QuackKind = "soft"): boolean {
  const audio = getContext();
  if (!audio || !quacksUnlocked()) return false;
  const now = audio.currentTime;
  const jitter = 0.9 + Math.random() * 0.2;

  if (kind === "pop") {
    popVoice(audio, now);
    quackVoice(audio, now + 0.03, 0.12, 520 * jitter, 0.35);
    quackVoice(audio, now + 0.18, 0.1, 620 * jitter, 0.25);
    return true;
  }

  if (kind === "loud") {
    quackVoice(audio, now, 0.22, 380 * jitter, 0.4);
    quackVoice(audio, now + 0.26, 0.18, 420 * jitter, 0.35);
    return true;
  }

  const repeats = Math.random() < 0.35 ? 2 : 1;
  for (let index = 0; index < repeats; index += 1) {
    quackVoice(audio, now + index * 0.24, 0.18, 300 * jitter, 0.28);
  }
  return true;
}
