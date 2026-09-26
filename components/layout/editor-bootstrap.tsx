"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { getWalkthrough } from "@/lib/learning/walkthroughs";
import { AlertTriangle } from "lucide-react";

/** Handles ?project=id query param and viewport-aware default panel state. */
export function EditorBootstrap() {
  const searchParams = useSearchParams();
  const openProject = useCircuitStore((s) => s.openProject);
  const loadProjects = useCircuitStore((s) => s.loadProjects);
  const loadSampleCircuit = useCircuitStore((s) => s.loadSampleCircuit);
  const setInspectMode = useEditorUiStore((s) => s.setInspectMode);
  const setInspectStep = useEditorUiStore((s) => s.setInspectStep);
  const setActiveWalkthroughId = useEditorUiStore(
    (s) => s.setActiveWalkthroughId
  );
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const projectId = searchParams.get("project");
    if (!projectId) {
      setProjectLoadError(null);
      return;
    }

    const tryOpen = () => {
      loadProjects();
      const loaded = openProject(projectId);
      setProjectLoadError(
        loaded
          ? null
          : "The requested project could not be found. It may have been deleted."
      );
    };

    if (useCircuitStore.persist.hasHydrated()) {
      tryOpen();
      return;
    }

    return useCircuitStore.persist.onFinishHydration(tryOpen);
  }, [searchParams, openProject, loadProjects]);

  useEffect(() => {
    const walkthroughId = searchParams.get("walkthrough");
    const walkthrough = getWalkthrough(walkthroughId);
    if (!walkthrough) {
      setActiveWalkthroughId(null);
      return;
    }

    const start = () => {
      loadSampleCircuit(walkthrough.circuit);
      setActiveWalkthroughId(walkthrough.id);
      setInspectMode(true);
      setInspectStep(0);
    };

    if (useCircuitStore.persist.hasHydrated()) {
      start();
      return;
    }
    return useCircuitStore.persist.onFinishHydration(start);
  }, [
    searchParams,
    loadSampleCircuit,
    setActiveWalkthroughId,
    setInspectMode,
    setInspectStep,
  ]);

  // Sanitize leftover lesson/challenge titles when opening free Build mode
  useEffect(() => {
    const sanitize = () => {
      const { circuit } = useCircuitStore.getState();
      const name = circuit.name ?? "";
      if (/^(Lesson|Challenge):\s*/i.test(name)) {
        const cleaned = name.replace(/^(Lesson|Challenge):\s*/i, "").trim();
        useCircuitStore.setState({
          circuit: {
            ...circuit,
            name: cleaned || "Untitled Circuit",
          },
        });
      }
    };
    if (useCircuitStore.persist.hasHydrated()) {
      sanitize();
      return;
    }
    return useCircuitStore.persist.onFinishHydration(sanitize);
  }, []);

  if (!projectLoadError) return null;

  return (
    <div
      role="alert"
      className="flex shrink-0 items-center gap-2 border-b border-[var(--color-warning)]/40 bg-[var(--color-warning-subtle)] px-3 py-2 text-xs text-[var(--color-warning)]"
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      {projectLoadError}
    </div>
  );
}
