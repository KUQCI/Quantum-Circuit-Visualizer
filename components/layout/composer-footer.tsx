"use client";

import Link from "next/link";
import { useThemeStore } from "@/store/theme-store";
import { Sun, Moon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComposerFooter() {
  const { theme, setTheme } = useThemeStore();

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-toolbar)] px-3 text-[10px] text-[var(--color-muted-foreground)] sm:px-4">
      <div className="flex items-center gap-3">
        <Link
          href="https://kuqci.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 transition-colors hover:text-[var(--color-brand)]"
        >
          KUQCI
          <ExternalLink className="h-2.5 w-2.5" />
        </Link>
        <Link
          href="/docs/composer"
          className="transition-colors hover:text-[var(--color-brand)]"
        >
          Documentation
        </Link>
        <Link
          href="/roadmap"
          className="transition-colors hover:text-[var(--color-brand)]"
        >
          Roadmap
        </Link>
        <span className="hidden sm:inline">Circuit Visualizer v1.0</span>
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
