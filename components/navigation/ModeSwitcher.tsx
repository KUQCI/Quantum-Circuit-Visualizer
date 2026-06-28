"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine, GraduationCap, Swords, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { isPathActive } from "@/lib/routes";

const modes = [
  { href: "/", label: "Home", icon: Home },
  { href: "/editor", label: "Build", icon: PenLine },
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/challenges", label: "Challenges", icon: Swords },
] as const;

interface ModeSwitcherProps {
  className?: string;
  size?: "sm" | "default";
}

export function ModeSwitcher({ className, size = "default" }: ModeSwitcherProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 p-0.5",
        className
      )}
      aria-label="App mode"
    >
      {modes.map((mode) => {
        const Icon = mode.icon;
        const active = isPathActive(pathname, mode.href);
        return (
          <Link
            key={mode.href}
            href={mode.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md font-medium transition-colors",
              size === "sm" ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-sm",
              active
                ? "bg-[var(--color-background)] text-[var(--color-brand)] shadow-sm"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            )}
          >
            <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
            <span className="hidden sm:inline">{mode.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
