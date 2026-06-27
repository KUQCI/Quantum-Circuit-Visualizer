"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CodeLanguageId } from "@/lib/code-adapters";

export type AlignmentMode = "freeform" | "left" | "layers";

interface EditorUiState {
  alignmentMode: AlignmentMode;
  codePanelLanguage: CodeLanguageId;
  showCodePanel: boolean;
  showVizPanels: boolean;
  showPhaseDisks: boolean;
  vizPanels: {
    probabilities: boolean;
    qsphere: boolean;
    statevector: boolean;
    histogram: boolean;
  };
  inspectMode: boolean;
  inspectStep: number;
  operationsPanelCollapsed: boolean;

  setAlignmentMode: (mode: AlignmentMode) => void;
  setCodePanelLanguage: (lang: CodeLanguageId) => void;
  setShowCodePanel: (show: boolean) => void;
  setShowVizPanels: (show: boolean) => void;
  setShowPhaseDisks: (show: boolean) => void;
  setVizPanel: (panel: keyof EditorUiState["vizPanels"], show: boolean) => void;
  setInspectMode: (on: boolean) => void;
  setInspectStep: (step: number) => void;
  setOperationsPanelCollapsed: (collapsed: boolean) => void;
}

export const useEditorUiStore = create<EditorUiState>()(
  persist(
    (set) => ({
      alignmentMode: "freeform",
      codePanelLanguage: "qiskit" as CodeLanguageId,
      showCodePanel: true,
      showVizPanels: false,
      showPhaseDisks: true,
      vizPanels: {
        probabilities: true,
        qsphere: true,
        statevector: true,
        histogram: true,
      },
      inspectMode: false,
      inspectStep: 0,
      operationsPanelCollapsed: false,

      setAlignmentMode: (mode) => set({ alignmentMode: mode }),
      setCodePanelLanguage: (lang) => set({ codePanelLanguage: lang }),
      setShowCodePanel: (show) => set({ showCodePanel: show }),
      setShowVizPanels: (show) => set({ showVizPanels: show }),
      setShowPhaseDisks: (show) => set({ showPhaseDisks: show }),
      setVizPanel: (panel, show) =>
        set((state) => ({
          vizPanels: { ...state.vizPanels, [panel]: show },
        })),
      setInspectMode: (on) => set({ inspectMode: on, inspectStep: 0 }),
      setInspectStep: (step) => set({ inspectStep: Math.max(0, step) }),
      setOperationsPanelCollapsed: (collapsed) =>
        set({ operationsPanelCollapsed: collapsed }),
    }),
    {
      name: "qiskit-visualizer-editor-ui",
      partialize: (state) => ({
        alignmentMode: state.alignmentMode,
        codePanelLanguage: state.codePanelLanguage,
        showCodePanel: state.showCodePanel,
        showVizPanels: state.showVizPanels,
        showPhaseDisks: state.showPhaseDisks,
        vizPanels: state.vizPanels,
      }),
    }
  )
);
