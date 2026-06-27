"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { AlertTriangle } from "lucide-react";

/** Handles ?project=id query param and mobile-friendly default panel state. */
export function EditorBootstrap() {
  const searchParams = useSearchParams();
  const openProject = useCircuitStore((s) => s.openProject);
  const loadProjects = useCircuitStore((s) => s.loadProjects);
  const {
    setOperationsPanelCollapsed,
    setShowCodePanel,
    setShowVizPanels,
  } = useEditorUiStore();
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

    loadProjects();
    const loaded = openProject(projectId);
    if (!loaded) {
      setProjectLoadError(
        "The requested project could not be found. It may have been deleted."
      );
    } else {
      setProjectLoadError(null);
    }
  }, [searchParams, openProject, loadProjects]);

  useEffect(() => {
    const isCompact = window.matchMedia("(max-width: 1024px)").matches;
    if (isCompact) {
      setOperationsPanelCollapsed(true);
      setShowCodePanel(false);
      setShowVizPanels(false);
    }
  }, [setOperationsPanelCollapsed, setShowCodePanel, setShowVizPanels]);

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
