"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import { ModeSwitcher } from "@/components/navigation/ModeSwitcher";
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
} from "lucide-react";

const primaryNav = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/editor",
    label: "Build",
    icon: PenLine,
    match: (p: string) => p === "/editor",
  },
  {
    href: "/learn",
    label: "Learn",
    icon: GraduationCap,
    match: (p: string) => p.startsWith("/learn"),
  },
  {
    href: "/challenges",
    label: "Challenges",
    icon: Swords,
    match: (p: string) => p.startsWith("/challenges"),
  },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderOpen,
    match: (p: string) => p === "/projects",
  },
] as const;

const secondaryNav = [
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/docs/composer", label: "Docs", icon: BookOpen },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/export", label: "Export", icon: Download },
] as const;

function isActive(pathname: string, match: (p: string) => boolean) {
  return match(pathname);
}

export function AppHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const showModeSwitcher =
    pathname === "/editor" ||
    pathname.startsWith("/learn") ||
    pathname.startsWith("/challenges");

  return (
    <header className="glass-nav-compact sticky top-0 z-40 shrink-0">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="https://kuqci.github.io/logo.png"
            alt="KUQCI"
            width={24}
            height={24}
            className="rounded-md"
            unoptimized
          />
          <span className="hidden text-sm font-semibold text-[var(--color-foreground)] sm:inline">
            KUQCI
          </span>
        </Link>

        {/* Desktop primary nav */}
        <nav className="hidden min-w-0 flex-1 items-center gap-0.5 md:flex">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.match);
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
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {showModeSwitcher && (
            <ModeSwitcher size="sm" className="hidden lg:inline-flex" />
          )}

          {/* More menu — desktop/tablet */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hidden h-8 gap-1.5 px-2 text-sm md:inline-flex"
                aria-label="More navigation"
              >
                <MoreHorizontal className="h-4 w-4" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2",
                        active && "text-[var(--color-brand)]"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4" />
                    Light theme
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                    Dark theme
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {[...primaryNav, ...secondaryNav].map((item) => {
                const Icon = item.icon;
                const active =
                  "match" in item
                    ? item.match(pathname)
                    : pathname === item.href || pathname.startsWith(item.href);
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2",
                        active && "text-[var(--color-brand)]"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4" />
                    Light theme
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
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
