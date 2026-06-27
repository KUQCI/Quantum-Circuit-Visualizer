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

export function AppHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 pb-1">
      <div className="glass-nav mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 rounded-2xl px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
        >
          <Image
            src="https://kuqci.github.io/logo.png"
            alt="KUQCI"
            width={28}
            height={28}
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
                  "kuqci-nav-link flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium whitespace-nowrap",
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
