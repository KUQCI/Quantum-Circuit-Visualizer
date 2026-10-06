import { getWeakestTopics } from "@/lib/learning/analytics";
import { LESSONS, LESSON_IDS } from "@/lib/learning/lessons";
import { getLevelFromXp, isLessonUnlockedByOrder } from "@/lib/learning/progress";
import type { ProgressBackup } from "@/lib/learning/progress-backup";

export interface ClassPlaylist {
  title: string;
  lessonIds: string[];
  classCode: string | null;
}

export function normalizeClassCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9-]{3,16}$/.test(code) ? code : null;
}

const CLASS_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateClassCode(random = Math.random): string {
  return Array.from({ length: 6 }, () => {
    const value = random();
    const index = Number.isFinite(value)
      ? Math.max(
          0,
          Math.min(
            CLASS_CODE_CHARACTERS.length - 1,
            Math.floor(value * CLASS_CODE_CHARACTERS.length)
          )
        )
      : 0;
    return CLASS_CODE_CHARACTERS[index];
  }).join("");
}

export function playlistSearchParams(playlist: ClassPlaylist): string {
  const params = new URLSearchParams();
  params.set("playlist", playlist.lessonIds.join(","));
  const title = playlist.title.trim().slice(0, 80);
  const classCode = normalizeClassCode(playlist.classCode);
  if (title) params.set("title", title);
  if (classCode) params.set("class", classCode);
  return params.toString();
}

export function parsePlaylistParams(
  params: URLSearchParams
): ClassPlaylist | null {
  const validIds = new Set(LESSON_IDS);
  const lessonIds: string[] = [];
  for (const candidate of params.get("playlist")?.split(",") ?? []) {
    const id = candidate.trim();
    if (!validIds.has(id) || lessonIds.includes(id)) continue;
    lessonIds.push(id);
    if (lessonIds.length === 40) break;
  }
  if (lessonIds.length === 0) return null;

  return {
    title:
      params.get("title")?.trim().slice(0, 80) || "Class playlist",
    lessonIds,
    classCode: normalizeClassCode(params.get("class")),
  };
}

export function isLessonOpenForLearner(
  lessonId: string,
  lessonOrder: number,
  completedLessons: readonly string[],
  allLessonIds: readonly { id: string; order: number }[],
  playlistLessonIds: readonly string[] | null
): boolean {
  if (playlistLessonIds?.includes(lessonId)) return true;
  return isLessonUnlockedByOrder(
    lessonId,
    lessonOrder,
    completedLessons,
    allLessonIds
  );
}

export interface RosterRow {
  fileName: string;
  learnerName: string;
  classCode: string | null;
  level: number;
  totalXp: number;
  lessonsDone: number;
  lessonsTotal: number;
  playlistDone: number | null;
  playlistTotal: number | null;
  currentStreak: number;
  lastActiveDate: string | null;
  quizAccuracy: number | null;
  weakestTopic: string | null;
  exportedAt: string;
}

export function buildRosterRow(
  fileName: string,
  backup: ProgressBackup,
  playlistLessonIds?: readonly string[]
): RosterRow {
  const validIds = new Set(LESSON_IDS);
  const completed = new Set(
    backup.progress.completedLessons.filter((id) => validIds.has(id))
  );
  const playlist = playlistLessonIds?.length
    ? [...new Set(playlistLessonIds.filter((id) => validIds.has(id)))]
    : null;
  const quizHistory = backup.progress.quizHistory;
  const { correct, wrong } = Object.values(quizHistory).reduce(
    (total, entry) => ({
      correct: total.correct + Math.max(0, entry.correct),
      wrong: total.wrong + Math.max(0, entry.wrong),
    }),
    { correct: 0, wrong: 0 }
  );
  const answered = correct + wrong;
  const weakestTopic = getWeakestTopics(LESSONS, quizHistory, 1)[0];
  const learnerName = backup.learner?.name.trim();

  return {
    fileName,
    learnerName: learnerName || fileName.replace(/\.json$/i, ""),
    classCode: normalizeClassCode(backup.learner?.classCode),
    level: getLevelFromXp(backup.progress.totalXp),
    totalXp: backup.progress.totalXp,
    lessonsDone: completed.size,
    lessonsTotal: LESSON_IDS.length,
    playlistDone: playlist
      ? playlist.filter((id) => completed.has(id)).length
      : null,
    playlistTotal: playlist?.length ?? null,
    currentStreak: backup.progress.currentStreak,
    lastActiveDate: backup.progress.lastActiveDate,
    quizAccuracy: answered > 0 ? correct / answered : null,
    weakestTopic: weakestTopic?.lessonTitle ?? null,
    exportedAt: backup.exportedAt,
  };
}

function isNewerExport(candidate: string, current: string): boolean {
  const candidateTime = Date.parse(candidate);
  const currentTime = Date.parse(current);
  if (Number.isFinite(candidateTime) && Number.isFinite(currentTime)) {
    return candidateTime > currentTime;
  }
  return candidate > current;
}

export function dedupeRoster(rows: RosterRow[]): RosterRow[] {
  const latest = new Map<string, RosterRow>();
  for (const row of rows) {
    const key = `${row.learnerName.toLowerCase()}\u0000${row.classCode ?? ""}`;
    const current = latest.get(key);
    if (!current || isNewerExport(row.exportedAt, current.exportedAt)) {
      latest.set(key, row);
    }
  }
  return [...latest.values()].sort((left, right) =>
    left.learnerName.localeCompare(right.learnerName)
  );
}

function csvCell(value: string | number): string {
  const text = String(value);
  const guarded =
    typeof value === "string" && /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(guarded)
    ? `"${guarded.replace(/"/g, '""')}"`
    : guarded;
}

export function rosterToCsv(rows: RosterRow[]): string {
  const header = [
    "Learner",
    "Class",
    "Level",
    "XP",
    "Lessons",
    "Playlist",
    "Streak",
    "Last active",
    "Quiz accuracy",
    "Needs work",
    "Exported at",
  ];
  const lines = rows.map((row) =>
    [
      row.learnerName,
      row.classCode ?? "",
      row.level,
      row.totalXp,
      `${row.lessonsDone}/${row.lessonsTotal}`,
      row.playlistDone === null || row.playlistTotal === null
        ? ""
        : `${row.playlistDone}/${row.playlistTotal}`,
      row.currentStreak,
      row.lastActiveDate ?? "",
      row.quizAccuracy === null
        ? ""
        : `${Math.round(row.quizAccuracy * 100)}%`,
      row.weakestTopic ?? "",
      row.exportedAt,
    ]
      .map(csvCell)
      .join(",")
  );
  return [header.join(","), ...lines].join("\r\n") + "\r\n";
}
