"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";
import { getWalkthrough } from "@/lib/learning/walkthroughs";
import { restoreWalkthroughBackup } from "@/lib/learning/walkthrough-backup";
import { AlertTriangle } from "lucide-react";
import { decodeShareParam } from "@/lib/share-link";
import { showAppToast } from "@/lib/app-toast";

/** Handles ?project=id query param and viewport-aware default panel state. */
export function EditorBootstrap() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const openProject = useCircuitStore((s) => s.openProject);
  const loadProjects = useCircuitStore((s) => s.loadProjects);
  const loadSampleCircuit = useCircuitStore((s) => s.loadSampleCircuit);
  const setActivityCircuit = useCircuitStore((s) => s.setActivityCircuit);
  const setInspectMode = useEditorUiStore((s) => s.setInspectMode);
  const setInspectStep = useEditorUiStore((s) => s.setInspectStep);
  const setActiveWalkthroughId = useEditorUiStore(
    (s) => s.setActiveWalkthroughId
  );
  const setWalkthroughBackup = useEditorUiStore((s) => s.setWalkthroughBackup);
  const lastStartedWalkthrough = useRef<string | null>(null);
  const handledShare = useRef<string | null>(null);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const shareParam = searchParams.get("share");
    if (!shareParam || handledShare.current === shareParam) return;
    handledShare.current = shareParam;

    const loadSharedCircuit = () => {
      const shared = decodeShareParam(shareParam);
      if (!shared) {
        showAppToast("This share link is invalid or too old");
      } else {
        setActivityCircuit({
          ...shared,
          name: `${shared.name || "Untitled Circuit"} (shared)`,
        });
        showAppToast("Loaded shared circuit");
      }
      const next = new URLSearchParams(searchParams.toString());
      next.delete("share");
      const suffix = next.toString() ? `?${next.toString()}` : "";
      router.replace(`${pathname}${suffix}`, { scroll: false });
    };

    if (useCircuitStore.persist.hasHydrated()) {
      loadSharedCircuit();
      return;
    }
    return useCircuitStore.persist.onFinishHydration(loadSharedCircuit);
  }, [pathname, router, searchParams, setActivityCircuit]);

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
      lastStartedWalkthrough.current = null;
      const exitWalkthrough = () => {
        const backup = useEditorUiStore.getState().walkthroughBackup;
        if (backup) {
          restoreWalkthroughBackup(backup);
          setWalkthroughBackup(null);
        }
        setActiveWalkthroughId(null);
        setInspectMode(false);
      };
      if (useCircuitStore.persist.hasHydrated()) {
        exitWalkthrough();
        return;
      }
      return useCircuitStore.persist.onFinishHydration(exitWalkthrough);
    }
    if (lastStartedWalkthrough.current === walkthrough.id) return;

    const start = () => {
      useCircuitStore.getState().flushActivityExit();
      const current = useCircuitStore.getState();
      if (!useEditorUiStore.getState().walkthroughBackup) {
        setWalkthroughBackup({
          circuit: structuredClone(current.circuit),
          projectId: current.currentProjectId,
        });
      }
      loadSampleCircuit(walkthrough.circuit);
      lastStartedWalkthrough.current = walkthrough.id;
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
    setWalkthroughBackup,
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
