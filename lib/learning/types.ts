import type { Circuit } from "@/lib/circuit-schema";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type SkillTag =
  | "qubits"
  | "gates"
  | "measurement"
  | "entanglement"
  | "qiskit";

export type CheckCondition =
  | { type: "manual" }
  | { type: "actionExport" }
  | { type: "actionImport" }
  | { type: "hasGate"; gate: string }
  | { type: "hasGateOnQubit"; gate: string; target: string }
  | { type: "hasControlledGate"; gate?: string }
  | { type: "hasMeasurement"; qubit?: string; classical?: string }
  | {
      type: "operationOrder";
      operations: Array<{
        gate: string;
        target?: string;
        control?: string;
      }>;
    }
  | { type: "exactCircuitMatch"; circuit: Circuit }
  | { type: "maxOperations"; count: number }
  | { type: "minQubits"; count: number }
  | { type: "noExtraGates"; allowed: string[] }
  | { type: "hasParameterGate"; gate: string; target?: string }
  | { type: "all"; conditions: CheckCondition[] }
  | { type: "any"; conditions: CheckCondition[] };

export interface LessonDefinition {
  id: string;
  title: string;
  module: string;
  description: string;
  story: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  xpReward: number;
  skills: SkillTag[];
  starterCircuit: Circuit;
  successCondition: CheckCondition;
  hint: string;
  quantaIntro: string;
  quantaHint: string;
  quantaSuccess: string;
  quantaIncorrect: string;
  order: number;
}

export type ChallengeType =
  | "build"
  | "match"
  | "fix"
  | "import"
  | "export";

export interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  xpReward: number;
  challengeType: ChallengeType;
  starterCircuit: Circuit;
  targetCircuit?: Circuit;
  importCode?: string;
  successCondition: CheckCondition;
  hint: string;
  quantaIntro: string;
  quantaHint: string;
  quantaSuccess: string;
  quantaIncorrect: string;
  order: number;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  icon: string;
}

export interface CheckResult {
  success: boolean;
  message: string;
  hint?: string;
}

export interface CheckerContext {
  actionExportDone?: boolean;
  actionImportDone?: boolean;
}
