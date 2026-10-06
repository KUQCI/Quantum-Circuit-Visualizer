"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Link2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuantaEmptyState } from "@/components/mascot/QuantaEmptyState";
import { showAppToast } from "@/lib/app-toast";
import {
  buildRosterRow,
  dedupeRoster,
  generateClassCode,
  normalizeClassCode,
  playlistSearchParams,
  rosterToCsv,
  type RosterRow,
} from "@/lib/learning/classroom";
import { LESSONS } from "@/lib/learning/lessons";
import {
  MODULE_LABELS,
  MODULE_ORDER,
} from "@/lib/learning/progress";
import {
  parseProgressBackup,
  type ProgressBackup,
} from "@/lib/learning/progress-backup";

interface ImportedBackup {
  fileName: string;
  backup: ProgressBackup;
}

interface ImportError {
  fileName: string;
  message: string;
}

type ImportResult =
  | { imported: ImportedBackup }
  | { error: ImportError };

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

export function ClassroomClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [origin, setOrigin] = useState("");
  const [title, setTitle] = useState("Class playlist");
  const [classCode, setClassCode] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [imported, setImported] = useState<ImportedBackup[]>([]);
  const [fileErrors, setFileErrors] = useState<ImportError[]>([]);
  const [classFilter, setClassFilter] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const orderedLessons = useMemo(
    () =>
      MODULE_ORDER.flatMap((moduleId) =>
        LESSONS.filter((lesson) => lesson.module === moduleId).sort(
          (left, right) => left.order - right.order
        )
      ),
    []
  );
  const selectedSet = new Set(selectedIds);
  const selectedLessonIds = orderedLessons
    .filter((lesson) => selectedSet.has(lesson.id))
    .map((lesson) => lesson.id);
  const normalizedClassCode = normalizeClassCode(classCode);
  const invalidClassCode = Boolean(classCode.trim() && !normalizedClassCode);
  const playlistLink =
    selectedLessonIds.length > 0 && origin
      ? `${origin}${BASE_PATH}/learn/?${playlistSearchParams({
          title,
          lessonIds: selectedLessonIds,
          classCode: normalizedClassCode,
        })}`
      : "";

  const rosterRows = useMemo(
    () =>
      dedupeRoster(
        imported.map(({ fileName, backup }) =>
          buildRosterRow(
            fileName,
            backup,
            selectedLessonIds.length > 0 ? selectedLessonIds : undefined
          )
        )
      ),
    [imported, selectedLessonIds]
  );
  const classCodes = [
    ...new Set(
      rosterRows
        .map((row) => row.classCode)
        .filter((code): code is string => code !== null)
    ),
  ].sort();
  const visibleRows = classFilter
    ? rosterRows.filter((row) => row.classCode === classFilter)
    : rosterRows;

  const importFiles = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) return;
    const results = await Promise.all(
      selectedFiles.map(async (file): Promise<ImportResult> => {
        try {
          const result = parseProgressBackup(await file.text());
          return result.ok
            ? { imported: { fileName: file.name, backup: result.backup } }
            : { error: { fileName: file.name, message: result.error } };
        } catch {
          return {
            error: {
              fileName: file.name,
              message: "Could not read the backup file",
            },
          };
        }
      })
    );
    setImported((current) => [
      ...current,
      ...results.flatMap((result) => ("imported" in result ? [result.imported] : [])),
    ]);
    setFileErrors((current) => [
      ...current,
      ...results.flatMap((result) => ("error" in result ? [result.error] : [])),
    ]);
  };

  const toggleModule = (moduleId: (typeof MODULE_ORDER)[number]) => {
    const moduleLessonIds = orderedLessons
      .filter((lesson) => lesson.module === moduleId)
      .map((lesson) => lesson.id);
    const allSelected = moduleLessonIds.every((id) => selectedSet.has(id));
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !moduleLessonIds.includes(id))
        : [...new Set([...current, ...moduleLessonIds])]
    );
  };

  const copyPlaylistLink = async () => {
    if (!playlistLink) return;
    try {
      await navigator.clipboard.writeText(playlistLink);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = playlistLink;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    showAppToast("Link copied");
  };

  const downloadCsv = () => {
    if (visibleRows.length === 0) return;
    const blob = new Blob([rosterToCsv(visibleRows)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `qci-roster-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const clearRoster = () => {
    setImported([]);
    setFileErrors([]);
    setClassFilter("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <main className="page-container max-w-6xl">
      <header className="page-header mb-6">
        <div className="flex items-start gap-3">
          <Users
            className="mt-1 h-7 w-7 text-[var(--color-brand)]"
            aria-hidden
          />
          <div>
            <h1 className="page-title text-3xl">Teacher tools</h1>
            <p className="page-description">
              Share a guided playlist and review learner progress files locally.
            </p>
          </div>
        </div>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Build a class playlist</CardTitle>
          <CardDescription>
            Choose lessons in curriculum order, then share the link with your
            learners.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-[var(--color-foreground)]">
              Playlist title
              <input
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
                maxLength={80}
                className="mt-1.5 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </label>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">
                Class code
                <input
                  value={classCode}
                  onChange={(event) =>
                    setClassCode(event.currentTarget.value.toUpperCase())
                  }
                  maxLength={16}
                  aria-invalid={invalidClassCode}
                  className="mt-1.5 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </label>
              <div className="mt-2 flex items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setClassCode(generateClassCode())}
                >
                  Generate
                </Button>
                {invalidClassCode && (
                  <span className="text-xs text-[var(--color-destructive)]">
                    Use 3–16 letters, numbers, or hyphens.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {MODULE_ORDER.map((moduleId, moduleIndex) => {
              const moduleLessons = orderedLessons.filter(
                (lesson) => lesson.module === moduleId
              );
              if (moduleLessons.length === 0) return null;
              const allSelected = moduleLessons.every((lesson) =>
                selectedSet.has(lesson.id)
              );
              return (
                <section
                  key={moduleId}
                  className="rounded-lg border border-[var(--color-border)] p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                      Module {String(moduleIndex + 1).padStart(2, "0")} ·{" "}
                      {MODULE_LABELS[moduleId]}
                    </h2>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleModule(moduleId)}
                    >
                      {allSelected ? "Clear all" : "Select all"}
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {moduleLessons.map((lesson) => (
                      <label
                        key={lesson.id}
                        className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--color-muted)]/50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSet.has(lesson.id)}
                          onChange={(event) => {
                            const checked = event.currentTarget.checked;
                            setSelectedIds((current) =>
                              checked
                                ? [...current, lesson.id]
                                : current.filter((id) => id !== lesson.id)
                            );
                          }}
                          className="mt-0.5 accent-[var(--color-brand)]"
                        />
                        <span className="text-[var(--color-foreground)]">
                          {lesson.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="space-y-3 rounded-lg border border-[var(--color-border)] p-4">
            <p className="text-sm font-medium">
              {selectedLessonIds.length}{" "}
              {selectedLessonIds.length === 1 ? "lesson" : "lessons"} selected
            </p>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              Playlist link
              <input
                readOnly
                value={playlistLink}
                placeholder="Select at least one lesson to create a link"
                className="mt-1.5 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-3 py-2 text-xs"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={!playlistLink}
                onClick={() => void copyPlaylistLink()}
              >
                <Link2 className="h-4 w-4" aria-hidden />
                Copy link
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!playlistLink}
                onClick={() =>
                  playlistLink &&
                  window.open(playlistLink, "_blank", "noopener,noreferrer")
                }
              >
                Open link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import learner backups</CardTitle>
          <CardDescription>
            Select one or more QCI progress backup files to build a classroom
            roster.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              multiple
              aria-label="Import learner backup files"
              onChange={(event) => {
                void importFiles(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
              className="max-w-full text-sm text-[var(--color-muted-foreground)] file:mr-3 file:rounded-md file:border file:border-[var(--color-border)] file:bg-[var(--color-background)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--color-foreground)]"
            />
            <Button
              type="button"
              variant="outline"
              disabled={visibleRows.length === 0}
              onClick={downloadCsv}
            >
              <Download className="h-4 w-4" aria-hidden />
              Download CSV
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={imported.length === 0 && fileErrors.length === 0}
              onClick={clearRoster}
            >
              Clear
            </Button>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Files stay in this browser; nothing is uploaded
          </p>

          {fileErrors.length > 0 && (
            <div
              className="space-y-1 rounded-md border border-[var(--color-destructive)]/40 p-3 text-sm"
              role="alert"
            >
              {fileErrors.map((error, index) => (
                <p key={`${error.fileName}-${index}`}>
                  <span className="font-medium">{error.fileName}:</span>{" "}
                  {error.message}
                </p>
              ))}
            </div>
          )}

          {rosterRows.length === 0 ? (
            <QuantaEmptyState
              variant="learning"
              title="Your classroom roster starts here"
              description="Share a playlist link with learners. They can choose “Send progress to teacher” to download a backup, then import those files here to review the class."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {visibleRows.length} learners in roster
                </p>
                <label className="flex items-center gap-2 text-sm">
                  Class
                  <select
                    value={classFilter}
                    onChange={(event) => setClassFilter(event.currentTarget.value)}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5"
                  >
                    <option value="">All</option>
                    {classCodes.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {visibleRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
                  No learners match this class code.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="bg-[var(--color-muted)]/40 text-xs uppercase text-[var(--color-muted-foreground)]">
                      <tr>
                        <th className="px-3 py-2.5">Learner</th>
                        <th className="px-3 py-2.5">Class</th>
                        <th className="px-3 py-2.5">Level</th>
                        <th className="px-3 py-2.5">XP</th>
                        <th className="px-3 py-2.5">Lessons</th>
                        {selectedLessonIds.length > 0 && (
                          <th className="px-3 py-2.5">Playlist</th>
                        )}
                        <th className="px-3 py-2.5">Streak</th>
                        <th className="px-3 py-2.5">Last active</th>
                        <th className="px-3 py-2.5">Quiz accuracy</th>
                        <th className="px-3 py-2.5">Needs work</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {visibleRows.map((row: RosterRow) => (
                        <tr
                          key={`${row.learnerName}-${row.classCode ?? "none"}`}
                        >
                          <td className="px-3 py-2.5 font-medium">
                            {row.learnerName}
                          </td>
                          <td className="px-3 py-2.5">{row.classCode ?? "—"}</td>
                          <td className="px-3 py-2.5">{row.level}</td>
                          <td className="px-3 py-2.5">{row.totalXp}</td>
                          <td className="px-3 py-2.5">
                            {row.lessonsDone}/{row.lessonsTotal}
                          </td>
                          {selectedLessonIds.length > 0 && (
                            <td className="px-3 py-2.5">
                              {row.playlistDone}/{row.playlistTotal}
                            </td>
                          )}
                          <td className="px-3 py-2.5">{row.currentStreak}</td>
                          <td className="px-3 py-2.5">
                            {row.lastActiveDate ?? "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            {percent(row.quizAccuracy)}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.weakestTopic ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
