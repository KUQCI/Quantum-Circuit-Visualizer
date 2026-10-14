import animatedStoryboardsJson from "./animated-storyboards.json";
import {
  getGateLabel,
  qubitIdFromIndex,
  type Circuit,
} from "../circuit-schema";

export interface AnimatedStoryboardGate {
  gate: string;
  targets: number[];
  controls?: number[];
  classicalTargets?: number[];
  params?: number[];
  label?: string;
}

export type AnimatedCircuitPanel = "probabilities" | "bloch" | "phase";

export type AnimatedStoryboardScene =
  | { kind: "title" }
  | {
      kind: "circuit";
      qubits: number;
      gates: AnimatedStoryboardGate[];
      reveal: number;
      add: number;
      panels: AnimatedCircuitPanel[];
      highlight?: number[];
    }
  | { kind: "histogram"; counts: Record<string, number>; title?: string }
  | {
      kind: "cards";
      heading?: string;
      items: Array<{ title: string; body?: string }>;
    }
  | {
      kind: "code";
      language?: string;
      lines: string[];
      highlight?: number[];
    }
  | { kind: "outro"; title: string; chips?: string[] };

export interface AnimatedStoryboardBeat {
  id: string;
  caption: string;
  speech: string;
  scene: AnimatedStoryboardScene;
}

export interface AnimatedStoryboard {
  id: string;
  module: string;
  title: string;
  beats: AnimatedStoryboardBeat[];
}

const animatedStoryboards = animatedStoryboardsJson as unknown as {
  lessons: AnimatedStoryboard[];
};

export function getAnimatedStoryboard(
  lessonId: string
): AnimatedStoryboard | null {
  return (
    animatedStoryboards.lessons.find(
      (storyboard) => storyboard.id === lessonId
    ) ?? null
  );
}

export function storyboardSceneToCircuit(
  scene: Extract<AnimatedStoryboardScene, { kind: "circuit" }>,
  name = "Animated storyboard"
): Circuit {
  const visibleCount = Math.min(
    scene.gates.length,
    Math.max(0, scene.reveal + scene.add)
  );
  const visibleGates = scene.gates.slice(0, visibleCount);
  const classicalBitCount = visibleGates.reduce(
    (count, gate) =>
      Math.max(count, ...((gate.classicalTargets ?? []).map((index) => index + 1))),
    0
  );

  return {
    name,
    qubits: Array.from({ length: scene.qubits }, (_, index) => ({
      id: `q${index}`,
      label: `q[${index}]`,
    })),
    classicalBits: Array.from({ length: classicalBitCount }, (_, index) => ({
      id: `c${index}`,
      label: `c[${index}]`,
    })),
    operations: visibleGates.map((gate, index) => ({
      id: `storyboard-gate-${index}`,
      type: gate.gate,
      label: getGateLabel(gate.gate),
      targets: gate.targets.map(qubitIdFromIndex),
      controls: (gate.controls ?? []).map(qubitIdFromIndex),
      classicalTargets: (gate.classicalTargets ?? []).map(
        (target) => `c${target}`
      ),
      column: index,
      ...(gate.params?.length
        ? {
            parameters: gate.params.map((value) => ({
              value,
              display: String(value),
            })),
          }
        : {}),
    })),
  };
}

export function animatedVideoTranscript(lessonId: string): string[] | null {
  return getAnimatedStoryboard(lessonId)?.beats.map((beat) => beat.speech) ?? null;
}
