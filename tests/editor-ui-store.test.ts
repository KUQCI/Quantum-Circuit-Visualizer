import { describe, expect, it } from "vitest";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import { useEditorUiStore } from "@/store/editor-ui-store";

describe("editor UI persistence", () => {
  it("persists walkthrough backups and drops malformed backups", () => {
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
  });
});
