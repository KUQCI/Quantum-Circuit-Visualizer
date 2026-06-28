"use client";

import Link from "next/link";
import { ExternalAnchor, KUQCI_HOME_URL } from "@/components/navigation/ExternalAnchor";
import { useThemeStore } from "@/store/theme-store";
import { Sun, Moon, ExternalLink, PenLine, GraduationCap, Download, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComposerFooter() {
  const { theme, setTheme } = useThemeStore();

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-toolbar)] px-3 text-[10px] text-[var(--color-muted-foreground)] sm:px-4">
      <div className="flex items-center gap-3">
        <ExternalAnchor
          href={KUQCI_HOME_URL}
          className="inline-flex items-center gap-1 transition-colors hover:text-[var(--color-brand)]"
        >
          KUQCI
          <ExternalLink className="h-2.5 w-2.5" />
        </ExternalAnchor>
        <Link href="/editor" className="inline-flex items-center gap-1 transition-colors hover:text-[var(--color-brand)]">
          <PenLine className="h-2.5 w-2.5" />
          Build
        </Link>
        <Link href="/learn" className="hidden items-center gap-1 transition-colors hover:text-[var(--color-brand)] sm:inline-flex">
          <GraduationCap className="h-2.5 w-2.5" />
          Learn
        </Link>
        <Link href="/export" className="hidden items-center gap-1 transition-colors hover:text-[var(--color-brand)] sm:inline-flex">
          <Download className="h-2.5 w-2.5" />
          Export
        </Link>
        <Link href="/projects" className="hidden items-center gap-1 transition-colors hover:text-[var(--color-brand)] md:inline-flex">
          <FolderOpen className="h-2.5 w-2.5" />
          Projects
        </Link>
        <Link
          href="/docs/composer"
          className="hidden transition-colors hover:text-[var(--color-brand)] lg:inline"
        >
          Docs
        </Link>
        <span className="hidden xl:inline">Circuit Visualizer v1.0</span>
      </div>
      <div className="flex items-center gap-1">
        <ThemeButton
          active={theme === "light"}
          onClick={() => setTheme("light")}
          title="Light theme"
        >
          <Sun className="h-3 w-3" />
        </ThemeButton>
        <ThemeButton
          active={theme === "dark"}
          onClick={() => setTheme("dark")}
          title="Dark theme"
        >
          <Moon className="h-3 w-3" />
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
        "flex h-6 w-6 items-center justify-center rounded transition-colors",
        active
          ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
          : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-brand)]"
      )}
    >
      {children}
    </button>
  );
}
