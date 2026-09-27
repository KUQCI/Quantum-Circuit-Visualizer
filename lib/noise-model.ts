export interface NoiseModel {
  enabled: boolean;
  depolarizing1q: number;
  depolarizing2q: number;
  readoutError: number;
}

export const IDEAL_NOISE: NoiseModel = {
  enabled: false,
  depolarizing1q: 0,
  depolarizing2q: 0,
  readoutError: 0,
};

export const NOISE_PRESETS: Array<{
  id: "ideal" | "light" | "realistic" | "noisy";
  label: string;
  model: NoiseModel;
}> = [
  { id: "ideal", label: "Ideal", model: IDEAL_NOISE },
  {
    id: "light",
    label: "Light",
    model: { enabled: true, depolarizing1q: 0.001, depolarizing2q: 0.01, readoutError: 0.01 },
  },
  {
    id: "realistic",
    label: "Realistic",
    model: { enabled: true, depolarizing1q: 0.005, depolarizing2q: 0.03, readoutError: 0.02 },
  },
  {
    id: "noisy",
    label: "Noisy",
    model: { enabled: true, depolarizing1q: 0.02, depolarizing2q: 0.1, readoutError: 0.05 },
  },
];

function clampProbability(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function clampNoiseModel(noise?: Partial<NoiseModel>): NoiseModel {
  return {
    enabled: noise?.enabled === true,
    depolarizing1q: clampProbability(noise?.depolarizing1q ?? 0),
    depolarizing2q: clampProbability(noise?.depolarizing2q ?? 0),
    readoutError: clampProbability(noise?.readoutError ?? 0),
  };
}

export function getNoisePresetLabel(noise: NoiseModel): string {
  const match = NOISE_PRESETS.find(
    ({ model }) =>
      model.enabled === noise.enabled &&
      model.depolarizing1q === noise.depolarizing1q &&
      model.depolarizing2q === noise.depolarizing2q &&
      model.readoutError === noise.readoutError
  );
  return match?.label ?? (noise.enabled ? "Custom" : "Ideal");
}
