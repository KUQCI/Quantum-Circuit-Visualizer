import { describe, expect, it } from "vitest";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import { restoreWalkthroughBackup } from "@/lib/learning/walkthrough-backup";
import { useCircuitStore } from "@/store/circuit-store";
import { useEditorUiStore } from "@/store/editor-ui-store";

describe("editor UI persistence", () => {
  it("persists valid walkthrough backups and drops malformed backups", () => {
    const backup = {
      circuit: createEmptyCircuit("Build circuit"),
      projectId: "project-1",
    };
    const state = useEditorUiStore.getState();
    const options = useEditorUiStore.persist.getOptions();
    const partialize = options.partialize;
    const merge = options.merge;

    expect(partialize?.({ ...state, walkthroughBackup: backup })).toMatchObject({
      walkthroughBackup: backup,
    });

    const merged = merge?.(
      {
        walkthroughBackup: {
          circuit: "not a circuit",
          projectId: 42,
        },
      },
      state
    );
    expect(merged?.walkthroughBackup).toBeNull();

    const invalidCircuit = merge?.(
      { walkthroughBackup: { circuit: {}, projectId: null } },
      state
    );
    expect(invalidCircuit?.walkthroughBackup).toBeNull();

    const validBackup = merge?.({ walkthroughBackup: backup }, state);
    expect(validBackup?.walkthroughBackup).toEqual(backup);
  });

  it("persists and migrates the onboarding tour completion flag", () => {
    const state = useEditorUiStore.getState();
    const options = useEditorUiStore.persist.getOptions();

    expect(options.partialize?.({ ...state, tourCompleted: true })).toMatchObject({
      tourCompleted: true,
    });

    expect(options.migrate?.({ tourCompleted: true }, 2)).toMatchObject({
      tourCompleted: true,
      showInspector: false,
      vizLayout: "tabs",
    });
    expect(options.migrate?.({ showInspector: true }, 2)).toMatchObject({
      tourCompleted: false,
      showInspector: false,
      vizLayout: "tabs",
    });
  });

  it("persists and migrates the lesson code panel preference", () => {
    const state = useEditorUiStore.getState();
    const options = useEditorUiStore.persist.getOptions();

    expect(options.partialize?.({ ...state, lessonCodeOpen: true })).toMatchObject({
      lessonCodeOpen: true,
    });
    expect(options.migrate?.({ lessonCodeOpen: true }, 3)).toMatchObject({
      lessonCodeOpen: true,
    });
    expect(options.migrate?.({}, 3)).toMatchObject({
      lessonCodeOpen: false,
    });
  });

  it("restores a walkthrough backup through the shared helper", () => {
    const originalState = useCircuitStore.getState();
    const original = structuredClone(originalState.circuit);
    const originalProjectId = originalState.currentProjectId;
    const backup = {
      circuit: createEmptyCircuit("Build circuit"),
      projectId: "project-1",
    };

    useCircuitStore.getState().setCircuit(createEmptyCircuit("Walkthrough"));
    expect(restoreWalkthroughBackup(backup)).toBe(true);
    expect(useCircuitStore.getState().circuit).toEqual(backup.circuit);
    expect(useCircuitStore.getState().currentProjectId).toBe("project-1");

    useCircuitStore.setState({
      circuit: original,
      currentProjectId: originalProjectId,
    });
  });
});
