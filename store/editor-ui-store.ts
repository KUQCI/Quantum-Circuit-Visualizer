"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CodeLanguageId } from "@/lib/code-adapters";
import { CODE_LANGUAGES } from "@/lib/code-adapters";
import { asBoolean, createSafeJsonStorage } from "@/lib/safe-persist";

export type AlignmentMode = "freeform" | "left" | "layers";

export const COMPOSER_LAYOUT_STORAGE_KEYS = [
  "react-resizable-panels:qci-composer-h",
  "react-resizable-panels:qci-composer-v",
  "react-resizable-panels:qci-composer-viz",
] as const;

interface EditorUiState {
  alignmentMode: AlignmentMode;
  codePanelLanguage: CodeLanguageId;
  showCodePanel: boolean;
  showVizPanels: boolean;
  showPhaseDisks: boolean;
  showInspector: boolean;
  vizPanels: {
    probabilities: boolean;
    qsphere: boolean;
    statevector: boolean;
    histogram: boolean;
  };
  inspectMode: boolean;
  inspectStep: number;
  operationsPanelCollapsed: boolean;
  /** Bumps when layout localStorage is cleared — remounts panel groups */
  layoutResetKey: number;

  setAlignmentMode: (mode: AlignmentMode) => void;
  setCodePanelLanguage: (lang: CodeLanguageId) => void;
  setShowCodePanel: (show: boolean) => void;
  setShowVizPanels: (show: boolean) => void;
  setShowPhaseDisks: (show: boolean) => void;
  setShowInspector: (show: boolean) => void;
  setVizPanel: (panel: keyof EditorUiState["vizPanels"], show: boolean) => void;
  setInspectMode: (on: boolean) => void;
  setInspectStep: (step: number) => void;
  setOperationsPanelCollapsed: (collapsed: boolean) => void;
  resetLayout: () => void;
}

export const useEditorUiStore = create<EditorUiState>()(
  persist(
    (set, get) => ({
      alignmentMode: "freeform",
      codePanelLanguage: "qiskit" as CodeLanguageId,
      showCodePanel: true,
      showVizPanels: true,
      showPhaseDisks: true,
      showInspector: true,
      vizPanels: {
        probabilities: true,
        qsphere: true,
        statevector: true,
        histogram: true,
      },
      inspectMode: false,
      inspectStep: 0,
      operationsPanelCollapsed: false,
      layoutResetKey: 0,

      setAlignmentMode: (mode) => set({ alignmentMode: mode }),
      setCodePanelLanguage: (lang) => set({ codePanelLanguage: lang }),
      setShowCodePanel: (show) => set({ showCodePanel: show }),
      setShowVizPanels: (show) => set({ showVizPanels: show }),
      setShowPhaseDisks: (show) => set({ showPhaseDisks: show }),
      setShowInspector: (show) => set({ showInspector: show }),
      setVizPanel: (panel, show) =>
        set((state) => ({
          vizPanels: { ...state.vizPanels, [panel]: show },
        })),
      setInspectMode: (on) => set({ inspectMode: on, inspectStep: 0 }),
      setInspectStep: (step) => set({ inspectStep: Math.max(0, step) }),
      setOperationsPanelCollapsed: (collapsed) =>
        set({ operationsPanelCollapsed: collapsed }),
      resetLayout: () => {
        if (typeof window !== "undefined") {
          for (const key of COMPOSER_LAYOUT_STORAGE_KEYS) {
            localStorage.removeItem(key);
          }
        }
        set({
          layoutResetKey: get().layoutResetKey + 1,
          operationsPanelCollapsed: false,
          showCodePanel: true,
          showVizPanels: true,
          showInspector: true,
          vizPanels: {
            probabilities: true,
            qsphere: true,
            statevector: true,
            histogram: true,
          },
        });
      },
    }),
    {
      name: "qiskit-visualizer-editor-ui",
      storage: createSafeJsonStorage<
        Pick<
          EditorUiState,
          | "alignmentMode"
          | "codePanelLanguage"
          | "showCodePanel"
          | "showVizPanels"
          | "showPhaseDisks"
          | "showInspector"
          | "operationsPanelCollapsed"
          | "vizPanels"
        >
      >(),
      merge: (persisted, current) => {
        const saved = persisted as Partial<EditorUiState> | undefined;
        if (!saved) return current;

        const validLanguage = CODE_LANGUAGES.some(
          (l) => l.id === saved.codePanelLanguage
        )
          ? saved.codePanelLanguage
          : current.codePanelLanguage;

        return {
          ...current,
          alignmentMode:
            saved.alignmentMode === "freeform" ||
            saved.alignmentMode === "left" ||
            saved.alignmentMode === "layers"
              ? saved.alignmentMode
              : current.alignmentMode,
          codePanelLanguage: validLanguage as CodeLanguageId,
          showCodePanel: asBoolean(saved.showCodePanel, current.showCodePanel),
          showVizPanels: asBoolean(saved.showVizPanels, current.showVizPanels),
          showPhaseDisks: asBoolean(
            saved.showPhaseDisks,
            current.showPhaseDisks
          ),
          showInspector: asBoolean(
            saved.showInspector,
            current.showInspector
          ),
          operationsPanelCollapsed: asBoolean(
            saved.operationsPanelCollapsed,
            current.operationsPanelCollapsed
          ),
          vizPanels: {
            probabilities: asBoolean(
              saved.vizPanels?.probabilities,
              current.vizPanels.probabilities
            ),
            qsphere: asBoolean(
              saved.vizPanels?.qsphere,
              current.vizPanels.qsphere
            ),
            statevector: asBoolean(
              saved.vizPanels?.statevector,
              current.vizPanels.statevector
            ),
            histogram: asBoolean(
              saved.vizPanels?.histogram,
              current.vizPanels.histogram
            ),
          },
        };
      },
      partialize: (state) => ({
        alignmentMode: state.alignmentMode,
        codePanelLanguage: state.codePanelLanguage,
        showCodePanel: state.showCodePanel,
        showVizPanels: state.showVizPanels,
        showPhaseDisks: state.showPhaseDisks,
        showInspector: state.showInspector,
        operationsPanelCollapsed: state.operationsPanelCollapsed,
        vizPanels: state.vizPanels,
      }),
    }
  )
);
