import { GATE_LIBRARY_UI } from "@/components/gates/gate-definitions";
import { getGateLabel, type Circuit } from "@/lib/circuit-schema";
import { getWalkthrough } from "@/lib/learning/walkthroughs";
import { MAX_SIMULATION_QUBITS } from "@/lib/quantum-state";
import { computeStepSnapshots, explainStep } from "@/lib/step-explanations";
import type { CheckCondition, LessonDefinition } from "./types";

export interface WalkthroughScene {
  id: string;
  title: string;
  caption: string;
  speech: string;
  snapshotStep: number | null;
  visibleSteps: number;
}

export interface LessonWalkthrough {
  lessonId: string;
  circuit: Circuit | null;
  scenes: WalkthroughScene[];
}

interface CircuitCandidate {
  circuit: Circuit;
  operationCount: number;
  source: "exact" | "walkthrough" | "operation-order" | "section";
  sectionIndex: number;
}

function collectCircuitConditions(
  condition: CheckCondition,
  exactCircuits: Circuit[],
  operationOrders: Extract<CheckCondition, { type: "operationOrder" }>[]
): void {
  if (condition.type === "exactCircuitMatch") {
    exactCircuits.push(condition.circuit);
    return;
  }

  if (condition.type === "operationOrder") {
    operationOrders.push(condition);
    return;
  }

  if (condition.type === "all" || condition.type === "any") {
    condition.conditions.forEach((child) =>
      collectCircuitConditions(child, exactCircuits, operationOrders)
    );
  }
}

function addQubitsThrough(circuit: Circuit, index: number): void {
  while (circuit.qubits.length <= index) {
    const nextIndex = circuit.qubits.length;
    circuit.qubits.push({ id: `q${nextIndex}`, label: `q[${nextIndex}]` });
  }
}

function resolveQubitId(circuit: Circuit, reference: string): string | null {
  if (circuit.qubits.some((qubit) => qubit.id === reference)) return reference;

  const match = /^q(\d+)$/.exec(reference);
  if (!match) return null;

  const index = Number(match[1]);
  if (!Number.isSafeInteger(index) || index >= MAX_SIMULATION_QUBITS) {
    return null;
  }
  const id = `q${index}`;
  addQubitsThrough(circuit, index);
  return circuit.qubits.some((qubit) => qubit.id === id) ? id : null;
}

function defaultTargetId(circuit: Circuit, controlId: string | null): string {
  const existingTarget = circuit.qubits.find(
    (qubit) => qubit.id !== controlId
  );
  if (existingTarget) return existingTarget.id;

  const nextIndex = circuit.qubits.length;
  addQubitsThrough(circuit, nextIndex);
  return `q${nextIndex}`;
}

function circuitForOperationOrder(
  lesson: LessonDefinition,
  condition: Extract<CheckCondition, { type: "operationOrder" }>
): Circuit | null {
  const circuit = structuredClone(lesson.starterCircuit);
  let column =
    circuit.operations.reduce(
      (lastColumn, operation) => Math.max(lastColumn, operation.column),
      -1
    ) + 1;

  for (const expected of condition.operations) {
    const definition = GATE_LIBRARY_UI.find(
      (gate) => gate.type === expected.gate
    );
    if (!definition) return null;

    const controlId = expected.control
      ? resolveQubitId(circuit, expected.control)
      : null;
    if (expected.control && !controlId) return null;

    const targetId = expected.target
      ? resolveQubitId(circuit, expected.target)
      : defaultTargetId(circuit, controlId);
    if (!targetId) return null;

    const parameters = definition.defaultParams3
      ? definition.defaultParams3.map((parameter) => ({ ...parameter }))
      : definition.defaultParams
        ? [{ ...definition.defaultParams }]
        : undefined;

    circuit.operations.push({
      id: `walkthrough-${lesson.id}-${circuit.operations.length}`,
      type: expected.gate,
      label: getGateLabel(expected.gate),
      targets: [targetId],
      controls: controlId ? [controlId] : [],
      classicalTargets: [],
      column: column++,
      ...(parameters ? { parameters } : {}),
    });
  }

  return circuit;
}

function makeCandidate(
  circuit: Circuit,
  source: CircuitCandidate["source"],
  sectionIndex: number
): CircuitCandidate | null {
  const operationCount = circuit.operations.filter(
    (operation) => operation.type !== "barrier"
  ).length;

  if (
    operationCount === 0 ||
    circuit.qubits.length > MAX_SIMULATION_QUBITS
  ) {
    return null;
  }

  return { circuit, operationCount, source, sectionIndex };
}

export function pickWalkthroughCircuit(
  lesson: LessonDefinition
): Circuit | null {
  const exactMatchCircuits: Circuit[] = [];
  const operationOrders: Extract<
    CheckCondition,
    { type: "operationOrder" }
  >[] = [];
  collectCircuitConditions(
    lesson.successCondition,
    exactMatchCircuits,
    operationOrders
  );
  const walkthroughCircuit = getWalkthrough(lesson.walkthroughId)?.circuit;

  const candidates = [
    ...exactMatchCircuits
      .map((circuit) => makeCandidate(circuit, "exact", -1))
      .filter((candidate): candidate is CircuitCandidate => candidate !== null),
    ...(walkthroughCircuit
      ? [makeCandidate(walkthroughCircuit, "walkthrough", -1)].filter(
          (candidate): candidate is CircuitCandidate => candidate !== null
        )
      : []),
    ...operationOrders.flatMap((condition) => {
      const circuit = circuitForOperationOrder(lesson, condition);
      const candidate = circuit
        ? makeCandidate(circuit, "operation-order", -1)
        : null;
      return candidate ? [candidate] : [];
    }),
    ...lesson.sections
      .map((section, sectionIndex) =>
        section.circuit
          ? makeCandidate(section.circuit, "section", sectionIndex)
          : null
      )
      .filter((candidate): candidate is CircuitCandidate => candidate !== null),
  ];

  candidates.sort(
    (a, b) =>
      b.operationCount - a.operationCount ||
      sourcePriority(b.source) - sourcePriority(a.source) ||
      b.sectionIndex - a.sectionIndex
  );

  return candidates[0]?.circuit ?? null;
}

function sourcePriority(source: CircuitCandidate["source"]): number {
  switch (source) {
    case "exact":
      return 4;
    case "walkthrough":
      return 3;
    case "operation-order":
      return 2;
    case "section":
      return 1;
  }
}

function firstTwoSentences(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  const sentences = trimmed.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [trimmed];
  return sentences
    .slice(0, 2)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .join(" ");
}

function makeScene(
  scene: Omit<WalkthroughScene, "speech">
): WalkthroughScene {
  return {
    ...scene,
    speech: toSpeechText(`${scene.title}. ${scene.caption}`),
  };
}

export function buildLessonWalkthrough(
  lesson: LessonDefinition
): LessonWalkthrough {
  let circuit = pickWalkthroughCircuit(lesson);
  let snapshots: ReturnType<typeof computeStepSnapshots> = [];

  if (circuit) {
    try {
      snapshots = computeStepSnapshots(circuit);
      if (snapshots.length === 0) circuit = null;
    } catch {
      circuit = null;
    }
  }

  const scenes: WalkthroughScene[] = [
    makeScene({
      id: "intro",
      title: lesson.title,
      caption: lesson.quantaIntro,
      snapshotStep: circuit ? 0 : null,
      visibleSteps: 0,
    }),
  ];

  if (circuit) {
    const lastStep = snapshots.length - 1;
    const steps =
      lastStep > 8
        ? [...Array.from({ length: 7 }, (_, index) => index + 1), lastStep]
        : Array.from({ length: lastStep }, (_, index) => index + 1);

    for (const step of steps) {
      const explanation = explainStep(snapshots[step], circuit);
      const title =
        lastStep > 8 && step === lastStep
          ? "…and the rest of the circuit"
          : explanation.title;
      const caption = [
        ...explanation.gateSummaries.map((summary) => summary.text),
        ...explanation.computed,
      ].join(" ");

      scenes.push(
        makeScene({
          id: `step-${step}`,
          title,
          caption,
          snapshotStep: step,
          visibleSteps: step,
        })
      );
    }
  } else {
    lesson.sections.forEach((section, index) => {
      scenes.push(
        makeScene({
          id: `section-${index}`,
          title: section.heading,
          caption: section.quantaNote ?? firstTwoSentences(section.body),
          snapshotStep: null,
          visibleSteps: 0,
        })
      );
    });
  }

  const lastStep = circuit ? snapshots.length - 1 : 0;
  scenes.push(
    makeScene({
      id: "outro",
      title: "Your turn",
      caption: firstTwoSentences(lesson.story),
      snapshotStep: circuit ? lastStep : null,
      visibleSteps: lastStep,
    })
  );

  return { lessonId: lesson.id, circuit, scenes };
}

export function toSpeechText(text: string): string {
  return text
    .replace(/\|([^|⟩]{1,6})⟩/gu, (_, ket: string) => {
      const spokenKet = Array.from(ket)
        .map((character) =>
          character === "+"
            ? "plus"
            : character === "-"
              ? "minus"
              : character
        )
        .join(" ");
      return `ket ${spokenKet}`;
    })
    .replace(/\s\+\s/g, " plus ")
    .replace(/`|[*_#]/g, "")
    .replace(/\bq(?:\[(\d+)\]|(\d+)\b)/gi, (_, indexed: string, bare: string) =>
      `qubit ${indexed ?? bare}`
    )
    .replace(/°/g, " degrees")
    .replace(/π/g, "pi")
    .replace(/→/g, " to ")
    .replace(/√/g, "square root of ")
    .replace(/†/g, " dagger")
    .replace(/%/g, " percent")
    .replace(/ψ/g, "psi")
    .replace(/[|⟩]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function estimateSceneMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(9000, Math.max(2500, words * 380));
}
