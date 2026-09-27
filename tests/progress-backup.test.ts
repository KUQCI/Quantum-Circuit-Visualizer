import { describe, expect, it } from "vitest";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import { LESSONS } from "@/lib/learning/lessons";
import {
  createProgressBackup,
  mergeProgress,
  parseProgressBackup,
  sanitizeProjects,
  type ProgressBackup,
} from "@/lib/learning/progress-backup";
import type { PersistedProgress } from "@/store/progress-store";

const emptyProgress = (): PersistedProgress => ({
  totalXp: 0,
  completedLessons: [],
  completedChallenges: [],
  unlockedAchievements: [],
  currentStreak: 0,
  lastActiveDate: null,
  skillXp: {
    qubits: 0,
    gates: 0,
    measurement: 0,
    entanglement: 0,
    qiskit: 0,
    algorithms: 0,
    phase: 0,
  },
  exportActionCount: 0,
  importActionCount: 0,
  projectSaved: false,
  hasEverPlacedGate: false,
  hasEverUsedControlledGate: false,
  dailyXp: {},
  quizFirstTryLessons: [],
  lastCelebratedLevel: 1,
  completedModules: [],
});

describe("progress backups", () => {
  it("round-trips an exported backup", () => {
    const projects = [
      {
        id: "project-1",
        name: "Demo",
        circuit: createEmptyCircuit("Demo", 1),
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
      },
    ];
    const backup = createProgressBackup(
      { ...emptyProgress(), totalXp: 120, completedLessons: ["what-is-a-qubit"] },
      projects
    );
    const parsed = parseProgressBackup(JSON.stringify(backup));

    expect(parsed).toEqual({ ok: true, backup });
  });

  it("rejects invalid JSON, kind, and version", () => {
    expect(parseProgressBackup("{")).toEqual({
      ok: false,
      error: "Not valid JSON",
    });
    expect(parseProgressBackup(JSON.stringify({ kind: "other", version: 1 }))).toEqual({
      ok: false,
      error: "Not a QCI progress backup",
    });
    expect(
      parseProgressBackup(
        JSON.stringify({ kind: "qci-progress-backup", version: 2 })
      )
    ).toEqual({ ok: false, error: "Unsupported backup version" });
  });

  it("sanitizes lesson ids and negative XP", () => {
    const raw: ProgressBackup = {
      kind: "qci-progress-backup",
      version: 1,
      exportedAt: "2025-01-01T00:00:00.000Z",
      progress: {
        ...emptyProgress(),
        totalXp: -10,
        completedLessons: ["what-is-a-qubit", 42 as never],
        skillXp: { ...emptyProgress().skillXp, gates: -5 },
      },
      projects: [],
    };
    const parsed = parseProgressBackup(JSON.stringify(raw));

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.backup.progress.totalXp).toBe(0);
      expect(parsed.backup.progress.completedLessons).toEqual([
        "what-is-a-qubit",
      ]);
      expect(parsed.backup.progress.skillXp.gates).toBe(0);
    }
  });

  it("merges progress with unions, maxima, boolean OR, and module recomputation", () => {
    const current = {
      ...emptyProgress(),
      totalXp: 100,
      completedLessons: LESSONS.filter((lesson) => lesson.module === "quantum-basics").map((lesson) => lesson.id),
      currentStreak: 2,
      hasEverPlacedGate: true,
      skillXp: { ...emptyProgress().skillXp, gates: 20 },
    };
    const incoming = {
      ...emptyProgress(),
      totalXp: 150,
      completedLessons: ["single-qubit-gates"],
      currentStreak: 3,
      hasEverUsedControlledGate: true,
      skillXp: { ...emptyProgress().skillXp, gates: 30 },
    };

    const merged = mergeProgress(current, incoming);

    expect(merged.completedLessons).toEqual([
      ...LESSONS.filter((lesson) => lesson.module === "quantum-basics").map(
        (lesson) => lesson.id
      ),
      "single-qubit-gates",
    ]);
    expect(merged.totalXp).toBe(150);
    expect(merged.currentStreak).toBe(3);
    expect(merged.hasEverPlacedGate).toBe(true);
    expect(merged.hasEverUsedControlledGate).toBe(true);
    expect(merged.skillXp.gates).toBe(30);
    expect(merged.completedModules).toContain("quantum-basics");
  });

  it("drops projects with invalid circuits", () => {
    const projects = sanitizeProjects([
      {
        id: "valid",
        name: "Valid",
        circuit: createEmptyCircuit("Valid", 1),
      },
      {
        id: "invalid",
        name: "Invalid",
        circuit: {},
      },
    ]);

    expect(projects.map((project) => project.id)).toEqual(["valid"]);
  });
});
