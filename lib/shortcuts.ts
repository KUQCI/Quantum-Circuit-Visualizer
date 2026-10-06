export interface ShortcutItem {
  keys: string[][];
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
      { keys: [["Mod", "Z"]], description: "Undo" },
      {
        keys: [
          ["Mod", "Shift", "Z"],
          ["Mod", "Y"],
        ],
        description: "Redo",
      },
      { keys: [["Mod", "D"]], description: "Duplicate selected gate" },
      { keys: [["Mod", "C"]], description: "Copy selected gate" },
      { keys: [["Mod", "V"]], description: "Paste copied gate" },
      {
        keys: [["Delete"], ["Backspace"]],
        description: "Delete selected gate(s)",
      },
    ],
  },
  {
    title: "Canvas",
    items: [
      {
        keys: [["Arrow keys"]],
        description: "Move selected gate(s)",
      },
      {
        keys: [["Shift", "Click"]],
        description: "Add/remove gate from selection",
      },
      {
        keys: [["Drag"]],
        description: "Box-select gates",
      },
      { keys: [["Mod", "A"]], description: "Select all gates" },
      {
        keys: [["Enter"], ["Space"]],
        description: "Select focused gate / place it on a wire",
      },
      { keys: [["Escape"]], description: "Dismiss overlay or selection" },
    ],
  },
  {
    title: "Navigation",
    items: [
      {
        keys: [["←"], ["→"]],
        description: "Switch narrow workspace tab",
      },
      {
        keys: [["Home"], ["End"]],
        description: "First / last narrow tab",
      },
      { keys: [["?"]], description: "Open this dialog" },
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
