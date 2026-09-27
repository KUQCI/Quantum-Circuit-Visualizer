"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isPathActive } from "@/lib/routes";
import { useThemeStore } from "@/store/theme-store";
import { ExternalAnchor, QCI_HOME_URL } from "@/components/navigation/ExternalAnchor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sun,
  Moon,
  Home,
  PenLine,
  GraduationCap,
  Swords,
  FolderOpen,
  BarChart3,
  Award,
  BookOpen,
  Menu,
  MoreHorizontal,
  Upload,
  Download,
  Palette,
  ExternalLink,
  Bug,
} from "lucide-react";

const primaryNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/editor", label: "Build", icon: PenLine },
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/challenges", label: "Challenges", icon: Swords },
  { href: "/projects", label: "Projects", icon: FolderOpen },
] as const;

const secondaryNav = [
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/docs/composer", label: "Docs", icon: BookOpen },
  { href: "/docs/assets", label: "Asset Tracker", icon: Palette },
  { href: "/docs/mascot", label: "Quanta Assets", icon: Palette },
  { href: "/docs/debug", label: "Translator Debug", icon: Bug },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/export", label: "Export", icon: Download },
] as const;

/**
 * Site-wide global navbar — identical on Home, Build, Learn, Challenges, etc.
 */
export function AppHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="glass-nav-compact sticky top-0 z-40 shrink-0">
      <div className="app-header-inner mx-auto flex h-14 w-full max-w-[1600px] items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Quantum Circuit Visualizer home"
        >
          <Image
            src="https://kuqci.github.io/logo.png"
            alt=""
            width={28}
            height={28}
            className="rounded-full border border-[var(--color-brand-border)]"
            unoptimized
            aria-hidden
          />
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-semibold text-[var(--color-foreground)]">
              Quantum Circuit Visualizer
            </span>
            <span className="mono-label block text-[0.65rem] text-[var(--color-muted-foreground)]">
              A QCI R&amp;D Project
            </span>
          </span>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center gap-0.5 md:flex"
          aria-label="Primary"
        >
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = isPathActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "kuqci-nav-link flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "active bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hidden h-8 gap-1.5 px-2 text-sm md:inline-flex"
                aria-label="More navigation"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                const active = isPathActive(pathname, item.href);
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2",
                        active && "text-[var(--color-brand)]"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <ExternalAnchor
                  href={QCI_HOME_URL}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Back to QCI
                </ExternalAnchor>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4" aria-hidden />
                    Light theme
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" aria-hidden />
                    Dark theme
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="touch-target h-10 w-10 sm:h-8 sm:w-8 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {[...primaryNav, ...secondaryNav].map((item) => {
                const Icon = item.icon;
                const active = isPathActive(pathname, item.href);
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2",
                        active && "text-[var(--color-brand)]"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <ExternalAnchor
                  href={QCI_HOME_URL}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Back to QCI
                </ExternalAnchor>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4" aria-hidden />
                    Light theme
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" aria-hidden />
                    Dark theme
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

/** Alias for shared global navbar */
export const GlobalNavbar = AppHeader;
