"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { getLayoutTier } from "@/lib/composer-layout";
import { AlertTriangle } from "lucide-react";

function readViewportTier() {
  if (typeof window === "undefined") return "desktop" as const;
  const w = window.innerWidth;
  const h = window.visualViewport?.height ?? window.innerHeight;
  return getLayoutTier(w, h);
}

/** Handles ?project=id query param and viewport-aware default panel state. */
export function EditorBootstrap() {
  const searchParams = useSearchParams();
  const openProject = useCircuitStore((s) => s.openProject);
  const loadProjects = useCircuitStore((s) => s.loadProjects);
  const [tier, setTier] = useState(readViewportTier);
  const isCompact = tier !== "desktop";
  const {
    setShowCodePanel,
    setShowVizPanels,
    setOperationsPanelCollapsed,
  } = useEditorUiStore();
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);

  useEffect(() => {
    const updateTier = () => setTier(readViewportTier());
    updateTier();
    window.addEventListener("resize", updateTier);
    window.visualViewport?.addEventListener("resize", updateTier);
    return () => {
      window.removeEventListener("resize", updateTier);
      window.visualViewport?.removeEventListener("resize", updateTier);
    };
  }, []);

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

  const initializedCompact = useRef(false);

  const applyViewportPanelDefaults = () => {
    if (isCompact) {
      setOperationsPanelCollapsed(true);
      if (!initializedCompact.current) {
        setShowCodePanel(false);
        setShowVizPanels(false);
        initializedCompact.current = true;
      }
      return;
    }

    initializedCompact.current = false;
    setOperationsPanelCollapsed(false);

    const { showCodePanel, showVizPanels, operationsPanelCollapsed } =
      useEditorUiStore.getState();
    const looksLikeMobilePersist =
      operationsPanelCollapsed && !showCodePanel && !showVizPanels;
    if (looksLikeMobilePersist) {
      setShowCodePanel(true);
      setShowVizPanels(true);
    }
  };

  useEffect(() => {
    applyViewportPanelDefaults();

    const unsub = useEditorUiStore.persist.onFinishHydration(() => {
      applyViewportPanelDefaults();
    });

    return unsub;
  }, [
    isCompact,
    setShowCodePanel,
    setShowVizPanels,
    setOperationsPanelCollapsed,
  ]);

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
