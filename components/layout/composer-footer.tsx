"use client";

import Link from "next/link";
import {
  ExternalAnchor,
  QCI_HOME_URL,
} from "@/components/navigation/ExternalAnchor";
import { useThemeStore } from "@/store/theme-store";
import { Sun, Moon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact Build footer — no duplicate site nav (global navbar owns that).
 */
export function ComposerFooter() {
  const { theme, setTheme } = useThemeStore();

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between gap-2 border-t border-[var(--color-border)] bg-[var(--color-toolbar)] px-2 text-[10px] text-[var(--color-muted-foreground)] sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ExternalAnchor
          href={QCI_HOME_URL}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-medium text-[var(--color-brand)] transition-colors hover:text-[var(--color-gold-duck)]"
        >
          Back to QCI
          <ExternalLink className="h-2.5 w-2.5" />
        </ExternalAnchor>
        <span className="hidden shrink-0 text-[var(--color-muted-foreground)]/70 sm:inline">
          A QCI R&amp;D project.
        </span>
        <Link
          href="/docs/composer"
          className="inline-flex shrink-0 items-center whitespace-nowrap transition-colors hover:text-[var(--color-brand)]"
        >
          Docs
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ThemeButton
          active={theme === "light"}
          onClick={() => setTheme("light")}
          title="Light theme"
        >
          <Sun className="h-3.5 w-3.5" />
        </ThemeButton>
        <ThemeButton
          active={theme === "dark"}
          onClick={() => setTheme("dark")}
          title="Dark theme"
        >
          <Moon className="h-3.5 w-3.5" />
        </ThemeButton>
      </div>
    </footer>
  );
}

function ThemeButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "touch-target-sm flex items-center justify-center rounded transition-colors",
        active
          ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
          : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-brand)]"
      )}
    >
      {children}
    </button>
  );
}
