"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import {
  Sun,
  Moon,
  Home,
  PenLine,
  GraduationCap,
  Swords,
  BarChart3,
  Award,
  FolderOpen,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/editor", label: "Build", icon: PenLine },
  { href: "/learn", label: "Learn", icon: GraduationCap, matchPrefix: "/learn" },
  { href: "/challenges", label: "Challenges", icon: Swords, matchPrefix: "/challenges" },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/docs/composer", label: "Docs", icon: BookOpen, matchPrefix: "/docs" },
];

interface AppHeaderProps {
  variant?: "default" | "compact";
}

export function AppHeader({ variant = "default" }: AppHeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const isCompact = variant === "compact";

  return (
    <header
      className={cn(
        "z-40 shrink-0",
        isCompact ? "glass-nav-compact" : "px-4 pt-2 pb-1"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          isCompact
            ? "h-[var(--app-header-height)] px-3 sm:px-4"
            : "glass-nav mx-auto h-11 max-w-7xl rounded-xl px-3 sm:px-4"
        )}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="https://kuqci.github.io/logo.png"
            alt="KUQCI"
            width={isCompact ? 22 : 24}
            height={isCompact ? 22 : 24}
            className="rounded-md"
            unoptimized
          />
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-semibold leading-tight text-[var(--color-foreground)]">
              KUQCI
            </span>
            <span className="text-[10px] leading-tight text-[var(--color-muted-foreground)]">
              Circuit Visualizer
            </span>
          </div>
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-0.5 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.matchPrefix && pathname.startsWith(item.matchPrefix)) ||
              (item.href === "/docs/composer" && pathname.startsWith("/docs"));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "kuqci-nav-link flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap",
                  active
                    ? "active text-[var(--color-brand)]"
                    : "text-[var(--color-muted-foreground)]"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="h-8 w-8 shrink-0"
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
