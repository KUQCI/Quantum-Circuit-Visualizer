"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import {
  createProgressBackup,
  parseProgressBackup,
  type ProgressBackup,
} from "@/lib/learning/progress-backup";
import { useCircuitStore } from "@/store/circuit-store";
import { useProgressStore } from "@/store/progress-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ProgressBackupCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<ProgressBackup | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const exportBackup = () => {
    const backup = createProgressBackup(
      useProgressStore.getState().exportSnapshot(),
      useCircuitStore.getState().projects
    );
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `qci-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setError(null);
    setStatus("Backup exported.");
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setStatus(null);
    try {
      const result = parseProgressBackup(await file.text());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPendingBackup(result.backup);
    } catch {
      setError("Could not read the backup file");
    }
  };

  const restore = (mode: "replace" | "merge") => {
    if (!pendingBackup) return;
    useCircuitStore.getState().loadProjects();
    useProgressStore
      .getState()
      .restoreSnapshot(pendingBackup.progress, mode);
    useCircuitStore.getState().importProjects(pendingBackup.projects, mode);
    setPendingBackup(null);
    setStatus("Progress restored.");
    setError(null);
  };

  const backupDate = pendingBackup
    ? new Date(pendingBackup.exportedAt).toLocaleDateString()
    : "";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Backup &amp; restore</CardTitle>
          <CardDescription>
            Download your XP, streak, achievements, lesson progress and saved
            projects as a file, or restore them on another browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={exportBackup}>
              <Download className="h-4 w-4" />
              Export backup
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Import backup
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </div>
          {error && (
            <p
              role="alert"
              className="mt-3 text-sm text-[var(--color-destructive)]"
            >
              {error}
            </p>
          )}
          {status && (
            <p
              role="status"
              className="mt-3 text-sm text-[var(--color-success)]"
            >
              {status}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(pendingBackup)}
        onOpenChange={(open) => {
          if (!open) setPendingBackup(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Restore progress backup?</DialogTitle>
            <DialogDescription>
              Backup from {backupDate}:{" "}
              {pendingBackup?.progress.completedLessons.length ?? 0} lessons,{" "}
              {pendingBackup?.progress.totalXp ?? 0} XP,{" "}
              {pendingBackup?.projects.length ?? 0} projects.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingBackup(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => restore("replace")}
            >
              Replace current
            </Button>
            <Button type="button" onClick={() => restore("merge")}>
              Merge with current
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
