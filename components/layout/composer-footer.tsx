"use client";

import Link from "next/link";
import { ExternalAnchor, KUQCI_HOME_URL } from "@/components/navigation/ExternalAnchor";
import { useThemeStore } from "@/store/theme-store";
import { Sun, Moon, ExternalLink, PenLine, GraduationCap, Download, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const footerLinks = [
  { href: "/editor", label: "Build", icon: PenLine },
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/export", label: "Export", icon: Download },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/docs/composer", label: "Docs" },
] as const;

export function ComposerFooter() {
  const { theme, setTheme } = useThemeStore();

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between gap-2 border-t border-[var(--color-border)] bg-[var(--color-toolbar)] px-2 text-[10px] text-[var(--color-muted-foreground)] sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ExternalAnchor
          href={KUQCI_HOME_URL}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap transition-colors hover:text-[var(--color-brand)]"
        >
          KUQCI
          <ExternalLink className="h-2.5 w-2.5" />
        </ExternalAnchor>
        {footerLinks.map((item) => {
          const Icon = "icon" in item ? item.icon : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap transition-colors hover:text-[var(--color-brand)]"
            >
              {Icon && <Icon className="h-2.5 w-2.5" />}
              {item.label}
            </Link>
          );
        })}
        <span className="hidden shrink-0 whitespace-nowrap xl:inline">
          Circuit Visualizer v1.0
        </span>
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
