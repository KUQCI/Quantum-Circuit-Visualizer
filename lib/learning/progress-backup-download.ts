"use client";

import { createProgressBackup } from "@/lib/learning/progress-backup";
import { useCircuitStore } from "@/store/circuit-store";
import { useClassroomStore } from "@/store/classroom-store";
import { useProgressStore } from "@/store/progress-store";

export function downloadProgressBackup(
  filename = `qci-progress-${new Date().toISOString().slice(0, 10)}.json`
): void {
  const { learnerName, joined } = useClassroomStore.getState();
  const backup = createProgressBackup(
    useProgressStore.getState().exportSnapshot(),
    useCircuitStore.getState().projects,
    { name: learnerName, classCode: joined?.classCode ?? null }
  );
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
