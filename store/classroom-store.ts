"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  normalizeClassCode,
  type ClassPlaylist,
} from "@/lib/learning/classroom";
import { LESSON_IDS } from "@/lib/learning/lessons";
import { createSafeJsonStorage } from "@/lib/safe-persist";

interface ClassroomState {
  learnerName: string;
  joined: ClassPlaylist | null;
  setLearnerName: (name: string) => void;
  joinPlaylist: (playlist: ClassPlaylist) => void;
  leavePlaylist: () => void;
}

const VALID_LESSON_IDS = new Set(LESSON_IDS);

function sanitizeLearnerName(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 60) : "";
}

function sanitizePlaylist(value: unknown): ClassPlaylist | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.lessonIds)) return null;
  const lessonIds = [
    ...new Set(
      record.lessonIds.filter(
        (id): id is string => typeof id === "string" && VALID_LESSON_IDS.has(id)
      )
    ),
  ].slice(0, 40);
  if (lessonIds.length === 0) return null;
  return {
    title:
      typeof record.title === "string"
        ? record.title.trim().slice(0, 80) || "Class playlist"
        : "Class playlist",
    lessonIds,
    classCode: normalizeClassCode(record.classCode),
  };
}

export const useClassroomStore = create<ClassroomState>()(
  persist(
    (set) => ({
      learnerName: "",
      joined: null,
      setLearnerName: (name) =>
        set({ learnerName: sanitizeLearnerName(name) }),
      joinPlaylist: (playlist) => set({ joined: sanitizePlaylist(playlist) }),
      leavePlaylist: () => set({ joined: null }),
    }),
    {
      name: "qiskit-visualizer-classroom",
      storage: createSafeJsonStorage<
        Pick<ClassroomState, "learnerName" | "joined">
      >(),
      merge: (persisted, current) => {
        const saved = persisted as Partial<
          Pick<ClassroomState, "learnerName" | "joined">
        >;
        return {
          ...current,
          learnerName: sanitizeLearnerName(saved?.learnerName),
          joined: sanitizePlaylist(saved?.joined),
        };
      },
    }
  )
);
