import { describe, expect, it, vi } from "vitest";
import { LESSONS, LESSON_IDS } from "@/lib/learning/lessons";
import {
  buildRosterRow,
  dedupeRoster,
  generateClassCode,
  isLessonOpenForLearner,
  normalizeClassCode,
  parsePlaylistParams,
  playlistSearchParams,
  rosterToCsv,
  type ClassPlaylist,
  type RosterRow,
} from "@/lib/learning/classroom";
import type { ProgressBackup } from "@/lib/learning/progress-backup";
import type { PersistedProgress } from "@/store/progress-store";

function progress(
  overrides: Partial<PersistedProgress> = {}
): PersistedProgress {
  return {
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
      qml: 0,
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
    quizHistory: {},
    sandboxCompleted: 0,
    ...overrides,
  };
}

function backup(
  progressData: PersistedProgress = progress(),
  learner?: ProgressBackup["learner"],
  exportedAt = "2026-01-01T00:00:00.000Z"
): ProgressBackup {
  return {
    kind: "qci-progress-backup",
    version: 1,
    exportedAt,
    progress: progressData,
    projects: [],
    ...(learner ? { learner } : {}),
  };
}

function rosterRow(
  learnerName: string,
  classCode: string | null,
  exportedAt: string
): RosterRow {
  return {
    fileName: `${learnerName}.json`,
    learnerName,
    classCode,
    level: 1,
    totalXp: 0,
    lessonsDone: 0,
    lessonsTotal: LESSON_IDS.length,
    playlistDone: null,
    playlistTotal: null,
    currentStreak: 0,
    lastActiveDate: null,
    quizAccuracy: null,
    weakestTopic: null,
    exportedAt,
  };
}

describe("classroom playlists", () => {
  it("round-trips playlist parameters", () => {
    const playlist: ClassPlaylist = {
      title: "Module 9 class",
      lessonIds: LESSON_IDS.slice(0, 2),
      classCode: " qci-9a ",
    };
    const parsed = parsePlaylistParams(
      new URLSearchParams(playlistSearchParams(playlist))
    );

    expect(parsed).toEqual({
      ...playlist,
      classCode: "QCI-9A",
    });
  });

  it("filters unknown and duplicate ids while preserving order and limiting results", () => {
    const [first, second] = LESSON_IDS;
    const params = new URLSearchParams({
      playlist: `unknown,${first},${second},${first},${LESSON_IDS.join(",")}`,
    });
    const parsed = parsePlaylistParams(params);

    expect(parsed?.lessonIds.slice(0, 2)).toEqual([first, second]);
    expect(new Set(parsed?.lessonIds).size).toBe(parsed?.lessonIds.length);
    expect(parsed?.lessonIds.length).toBeLessThanOrEqual(40);
    expect(parsePlaylistParams(new URLSearchParams("playlist=unknown"))).toBeNull();
  });

  it("caps playlists at 40 lessons", async () => {
    const lessonIds = Array.from({ length: 45 }, (_, index) => `lesson-${index}`);
    vi.resetModules();
    vi.doMock("@/lib/learning/lessons", () => ({
      LESSONS: [],
      LESSON_IDS: lessonIds,
    }));

    try {
      const { parsePlaylistParams: parseWithManyLessons } = await import(
        "@/lib/learning/classroom"
      );
      const parsed = parseWithManyLessons(
        new URLSearchParams({ playlist: lessonIds.join(",") })
      );

      expect(parsed?.lessonIds).toHaveLength(40);
      expect(parsed?.lessonIds).toEqual(lessonIds.slice(0, 40));
    } finally {
      vi.doUnmock("@/lib/learning/lessons");
      vi.resetModules();
    }
  });

  it("defaults and caps the title and normalizes class codes", () => {
    const [lessonId] = LESSON_IDS;
    expect(
      parsePlaylistParams(
        new URLSearchParams(`playlist=${lessonId}&title=%20%20`)
      )?.title
    ).toBe("Class playlist");
    expect(
      parsePlaylistParams(
        new URLSearchParams(
          `playlist=${lessonId}&title=${"a".repeat(100)}`
        )
      )?.title
    ).toHaveLength(80);
    expect(normalizeClassCode(" ab-29 ")).toBe("AB-29");
    for (const invalid of ["", "AB", "A".repeat(17), "A B", "QCI_", 42, null]) {
      expect(normalizeClassCode(invalid)).toBeNull();
    }
  });

  it("generates six unambiguous class-code characters", () => {
    const values = [0, 0.25, 0.5, 0.75, 0.99, 0.1];
    let index = 0;
    const code = generateClassCode(() => values[index++]);

    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });

  it("opens playlist lessons while preserving sequential unlocks elsewhere", () => {
    const target = LESSONS.find((lesson) => lesson.order > 1)!;
    const allIds = LESSONS.map(({ id, order }) => ({ id, order }));
    const playlistId = target.id;

    expect(
      isLessonOpenForLearner(
        target.id,
        target.order,
        [],
        allIds,
        [playlistId]
      )
    ).toBe(true);
    expect(
      isLessonOpenForLearner(target.id, target.order, [], allIds, null)
    ).toBe(false);
    expect(
      isLessonOpenForLearner(
        target.id,
        target.order,
        [LESSONS.find((lesson) => lesson.order === target.order - 1)!.id],
        allIds,
        null
      )
    ).toBe(true);
  });
});

describe("classroom roster", () => {
  it("builds learner metrics from a progress backup and falls back to the filename", () => {
    const [firstLesson, secondLesson] = LESSONS;
    const firstQuestion = firstLesson.quiz[0];
    const row = buildRosterRow(
      "ada.json",
      backup(
        progress({
          totalXp: 500,
          completedLessons: [
            firstLesson.id,
            "unknown-lesson",
          ],
          currentStreak: 4,
          lastActiveDate: "2026-01-03",
          quizHistory: {
            [`${firstLesson.id}:${firstQuestion.id}`]: {
              box: 1,
              due: "2026-01-05",
              correct: 3,
              wrong: 1,
            },
          },
        })
      ),
      [firstLesson.id, secondLesson.id]
    );

    expect(row.learnerName).toBe("ada");
    expect(row.level).toBe(4);
    expect(row.lessonsDone).toBe(1);
    expect(row.lessonsTotal).toBe(LESSON_IDS.length);
    expect(row.playlistDone).toBe(1);
    expect(row.playlistTotal).toBe(2);
    expect(row.currentStreak).toBe(4);
    expect(row.lastActiveDate).toBe("2026-01-03");
    expect(row.quizAccuracy).toBe(0.75);
    expect(row.weakestTopic).toBe(firstLesson.title);
  });

  it("uses null for unanswered accuracy and absent playlist metrics", () => {
    const row = buildRosterRow("learner.JSON", backup());

    expect(row.learnerName).toBe("learner");
    expect(row.quizAccuracy).toBeNull();
    expect(row.playlistDone).toBeNull();
    expect(row.playlistTotal).toBeNull();
    expect(row.weakestTopic).toBeNull();
  });

  it("keeps the latest export for each learner and class", () => {
    const rows = [
      rosterRow("Ada", "QCI-A", "2026-01-01T00:00:00.000Z"),
      rosterRow("ada", "QCI-A", "2026-01-03T00:00:00.000Z"),
      rosterRow("Ada", "QCI-B", "2026-01-02T00:00:00.000Z"),
      rosterRow("Bo", null, "2026-01-01T00:00:00.000Z"),
    ];

    expect(dedupeRoster(rows)).toEqual([
      rows[1],
      rows[2],
      rows[3],
    ]);
  });

  it("quotes CSV fields, guards formulas, formats accuracy, and uses CRLF", () => {
    const row = {
      ...rosterRow('=Ada, "A"\nLearner', "+QCI", "2026-01-03T00:00:00.000Z"),
      lessonsDone: 2,
      playlistDone: 1,
      playlistTotal: 3,
      quizAccuracy: 0.876,
      lastActiveDate: "-2026-01-02",
      weakestTopic: "@phase, gates",
    };
    const csv = rosterToCsv([row]);

    expect(csv.startsWith("Learner,Class,Level,XP,Lessons,Playlist,")).toBe(true);
    expect(csv).toContain("\"'=Ada, \"\"A\"\"\nLearner\"");
    expect(csv).toContain("'+QCI");
    expect(csv).toContain("'-2026-01-02");
    expect(csv).toContain("88%");
    expect(csv).toContain("\"'@phase, gates\"");
    expect(csv.endsWith("\r\n")).toBe(true);
  });
});
