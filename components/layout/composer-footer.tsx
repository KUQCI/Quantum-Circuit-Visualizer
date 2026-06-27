"use client";

import Link from "next/link";
import { useThemeStore } from "@/store/theme-store";
import { Sun, Moon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComposerFooter() {
  const { theme, setTheme } = useThemeStore();

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-[rgba(125,211,252,0.16)] bg-[var(--color-toolbar)] px-4 text-[10px] text-[var(--color-muted-foreground)]">
      <div className="flex items-center gap-3">
        <Link
          href="https://kuqci.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-[var(--color-cyan-quantum)]"
        >
          KUQCI
          <ExternalLink className="h-2.5 w-2.5" />
        </Link>
        <Link
          href="/docs/composer"
          className="hover:text-[var(--color-cyan-quantum)]"
        >
          Documentation
        </Link>
        <Link href="/roadmap" className="hover:text-[var(--color-cyan-quantum)]">
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
      onClick={onClick}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded transition-colors",
        active
          ? "bg-[rgba(125,211,252,0.15)] text-[var(--color-cyan-quantum)]"
          : "text-[var(--color-muted-foreground)] hover:bg-[rgba(125,211,252,0.08)] hover:text-[var(--color-cyan-quantum)]"
      )}
    >
      {children}
    </button>
  );
}
