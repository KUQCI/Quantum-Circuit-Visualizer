"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Circle, Download, LogOut, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { showAppToast } from "@/lib/app-toast";
import {
  parsePlaylistParams,
  type ClassPlaylist,
} from "@/lib/learning/classroom";
import { LESSONS } from "@/lib/learning/lessons";
import { downloadProgressBackup } from "@/lib/learning/progress-backup-download";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";
import { useClassroomStore } from "@/store/classroom-store";
import { useProgressStore } from "@/store/progress-store";

function samePlaylist(
  left: ClassPlaylist | null,
  right: ClassPlaylist | null
): boolean {
  return Boolean(
    left &&
      right &&
      left.title === right.title &&
      left.classCode === right.classCode &&
      left.lessonIds.length === right.lessonIds.length &&
      left.lessonIds.every((id, index) => id === right.lessonIds[index])
  );
}

function PlaylistInvitation() {
  const searchParams = useSearchParams();
  const hydrated = usePersistHydrated(useClassroomStore.persist);
  const learnerName = useClassroomStore((state) => state.learnerName);
  const joined = useClassroomStore((state) => state.joined);
  const setLearnerName = useClassroomStore((state) => state.setLearnerName);
  const joinPlaylist = useClassroomStore((state) => state.joinPlaylist);
  const [name, setName] = useState("");
  const playlist = parsePlaylistParams(
    new URLSearchParams(searchParams.toString())
  );

  useEffect(() => {
    if (hydrated) setName(learnerName);
  }, [hydrated, learnerName]);

  if (!hydrated || !playlist || samePlaylist(playlist, joined)) return null;

  return (
    <Card className="mb-6 border-[var(--color-brand-border)]">
      <CardHeader>
        <p className="qci-section-eyebrow">Class playlist</p>
        <CardTitle className="[overflow-wrap:anywhere]">{playlist.title}</CardTitle>
        <CardDescription>
          {playlist.classCode
            ? `Class code: ${playlist.classCode} · `
            : ""}
          {playlist.lessonIds.length}{" "}
          {playlist.lessonIds.length === 1 ? "lesson" : "lessons"} selected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="block max-w-sm text-sm font-medium text-[var(--color-foreground)]">
          Your name
          <input
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            maxLength={60}
            autoComplete="name"
            className="mt-1.5 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </label>
        <Button
          type="button"
          onClick={() => {
            setLearnerName(name);
            joinPlaylist(playlist);
            showAppToast("Joined class playlist");
          }}
        >
          Join class
        </Button>
      </CardContent>
    </Card>
  );
}

export function PlaylistInvitationCard() {
  return (
    <Suspense fallback={null}>
      <PlaylistInvitation />
    </Suspense>
  );
}

export function JoinedClassCard() {
  const hydrated = usePersistHydrated(useClassroomStore.persist);
  const joined = useClassroomStore((state) => state.joined);
  const learnerName = useClassroomStore((state) => state.learnerName);
  const leavePlaylist = useClassroomStore((state) => state.leavePlaylist);
  const completedLessons = useProgressStore((state) => state.completedLessons);
  const progressHydrated = usePersistHydrated(useProgressStore.persist);

  if (!hydrated || !progressHydrated || !joined) return null;

  const lessons = joined.lessonIds.flatMap((id) => {
    const lesson = LESSONS.find((item) => item.id === id);
    return lesson ? [lesson] : [];
  });
  if (lessons.length === 0) return null;
  const done = lessons.filter((lesson) =>
    completedLessons.includes(lesson.id)
  ).length;
  const nextLesson = lessons.find(
    (lesson) => !completedLessons.includes(lesson.id)
  );
  const primaryLesson = nextLesson ?? lessons[0];
  const learnerSlug =
    learnerName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "learner";

  return (
    <Card className="mb-6 border-[var(--color-brand-border)]">
      <CardHeader>
        <p className="qci-section-eyebrow">Your class</p>
        <CardTitle className="[overflow-wrap:anywhere]">{joined.title}</CardTitle>
        <CardDescription>
          {joined.classCode ? `Class code: ${joined.classCode} · ` : ""}
          {done}/{lessons.length} lessons complete
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]"
          role="progressbar"
          aria-label="Class playlist progress"
          aria-valuenow={Math.round((done / lessons.length) * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-[var(--color-brand)] transition-[width]"
            style={{ width: `${Math.round((done / lessons.length) * 100)}%` }}
          />
        </div>
        <ol className="grid gap-2 sm:grid-cols-2">
          {lessons.map((lesson, index) => {
            const isDone = completedLessons.includes(lesson.id);
            const isNext = lesson.id === nextLesson?.id;
            const Marker = isDone ? Check : isNext ? MoveRight : Circle;
            return (
              <li key={lesson.id}>
                <Link
                  href={`/learn/${lesson.id}`}
                  className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm hover:border-[var(--color-brand-border)]"
                >
                  <Marker
                    className={`h-4 w-4 shrink-0 ${
                      isDone
                        ? "text-[var(--color-success)]"
                        : isNext
                          ? "text-[var(--color-brand)]"
                          : "text-[var(--color-muted-foreground)]"
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {isDone ? "Done" : isNext ? "Next" : `Lesson ${index + 1}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/learn/${primaryLesson.id}`}>
              {nextLesson
                ? `Next: ${nextLesson.title}`
                : `Review: ${primaryLesson.title}`}
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const date = new Date().toISOString().slice(0, 10);
              downloadProgressBackup(
                `qci-progress-${learnerSlug}-${date}.json`
              );
              showAppToast("Progress backup downloaded");
            }}
          >
            <Download className="h-4 w-4" aria-hidden />
            Send progress to teacher
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (window.confirm("Leave this class playlist?")) {
                leavePlaylist();
              }
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Leave class
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
