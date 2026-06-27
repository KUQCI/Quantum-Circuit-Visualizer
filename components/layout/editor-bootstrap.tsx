"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";

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

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const projectId = searchParams.get("project");
    if (projectId) {
      openProject(projectId);
    }
  }, [searchParams, openProject]);

  useEffect(() => {
    const isCompact = window.matchMedia("(max-width: 1024px)").matches;
    if (isCompact) {
      setOperationsPanelCollapsed(true);
      setShowCodePanel(false);
      setShowVizPanels(false);
    }
  }, [setOperationsPanelCollapsed, setShowCodePanel, setShowVizPanels]);

  return null;
}
