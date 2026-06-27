"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import {
  Atom,
  Sun,
  Moon,
  Home,
  PenLine,
  Upload,
  Download,
  FolderOpen,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/editor", label: "Editor", icon: PenLine },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/export", label: "Export", icon: Download },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/roadmap", label: "Roadmap", icon: Map },
];

export function AppHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-card)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-card)]/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold text-[var(--color-accent-foreground)]"
        >
          <Atom className="h-5 w-5" />
          <span className="hidden sm:inline">Qiskit Visualizer</span>
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-0.5 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-[var(--color-secondary)] text-[var(--color-accent-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="shrink-0"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
