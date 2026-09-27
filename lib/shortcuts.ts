export interface ShortcutItem {
  keys: string[];
  description: string;
}

export interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Editing",
    items: [
      { keys: ["Mod", "Z"], description: "Undo the last change" },
      {
        keys: ["Mod", "Shift", "Z"],
        description: "Redo the last change with the Shift shortcut",
      },
      {
        keys: ["Mod", "Y"],
        description: "Redo the last change with the Y shortcut",
      },
      { keys: ["Mod", "D"], description: "Duplicate the selected gate" },
      {
        keys: ["Delete"],
        description: "Delete the selected gate with Delete",
      },
      {
        keys: ["Backspace"],
        description: "Delete the selected gate with Backspace",
      },
    ],
  },
  {
    title: "Canvas",
    items: [
      { keys: ["Arrow keys"], description: "Move the selected gate" },
      {
        keys: ["Enter"],
        description: "Select a focused gate or place it with Enter",
      },
      {
        keys: ["Space"],
        description: "Select a focused gate or place it with Space",
      },
      { keys: ["Escape"], description: "Dismiss an active overlay" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["←", "→"], description: "Move between narrow workspace tabs" },
      { keys: ["Home"], description: "Jump to the first narrow workspace tab" },
      { keys: ["End"], description: "Jump to the last narrow workspace tab" },
      { keys: ["?"], description: "Open keyboard shortcuts" },
    ],
  },
];

export const OPEN_SHORTCUTS_EVENT = "qci:open-shortcuts";

export function requestOpenShortcuts(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_SHORTCUTS_EVENT));
  }
}

export function isEditableShortcutTarget(target: EventTarget | null): boolean {
  const element =
    typeof HTMLElement !== "undefined" && target instanceof HTMLElement
      ? target
      : null;
  if (!element) return false;
  return (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.tagName === "SELECT" ||
    element.isContentEditable ||
    Boolean(element.closest(".monaco-editor"))
  );
}
