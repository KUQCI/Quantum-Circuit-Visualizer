"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  isEditableShortcutTarget,
  OPEN_SHORTCUTS_EVENT,
  SHORTCUT_GROUPS,
} from "@/lib/shortcuts";
import { normalizePath } from "@/lib/routes";
import Link from "next/link";

function isShortcutPage(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === "/editor" || path.startsWith("/learn/");
}

export function ShortcutsDialog() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isMac = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      /Mac|iPhone|iPad|iPod/.test(navigator.platform),
    []
  );

  useEffect(() => {
    const openDialog = () => setOpen(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        isShortcutPage(pathname) &&
        !isEditableShortcutTarget(event.target) &&
        (event.key === "?" || (event.code === "Slash" && event.shiftKey))
      ) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener(OPEN_SHORTCUTS_EVENT, openDialog);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(OPEN_SHORTCUTS_EVENT, openDialog);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [pathname]);

  const modifierLabel = isMac ? "⌘" : "Ctrl";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-describedby="keyboard-shortcuts-description">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription id="keyboard-shortcuts-description">
            Quick controls for Build and lesson workspaces.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title} aria-labelledby={`shortcut-${group.title}`}>
              <h3
                id={`shortcut-${group.title}`}
                className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]"
              >
                {group.title}
              </h3>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item.description}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span>{item.description}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {item.keys.map((alternative, alternativeIndex) => (
                        <span
                          key={alternative.join("-")}
                          className="flex items-center gap-1"
                        >
                          {alternativeIndex > 0 && (
                            <span
                              className="px-0.5 text-xs text-[var(--color-muted-foreground)]"
                              aria-hidden="true"
                            >
                              or
                            </span>
                          )}
                          {alternative.map((key) => (
                            <kbd
                              key={key}
                              className="rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--color-foreground)]"
                            >
                              {key === "Mod" ? modifierLabel : key}
                            </kbd>
                          ))}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Press <kbd className="rounded border border-[var(--color-border)] px-1 font-mono">?</kbd>{" "}
          anytime in Build or a lesson.{" "}
          <Link
            href="/docs/composer"
            prefetch={false}
            className="text-[var(--color-brand)] hover:underline"
          >
            Full docs
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
