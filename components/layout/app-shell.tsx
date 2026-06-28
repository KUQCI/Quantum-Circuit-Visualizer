"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppHeader } from "@/components/layout/app-header";
import { AppBootstrap } from "@/components/layout/app-bootstrap";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { cn } from "@/lib/utils";

function isWorkspacePlayerRoute(pathname: string) {
  return (
    /^\/learn\/[^/]+$/.test(pathname) ||
    /^\/challenges\/[^/]+$/.test(pathname)
  );
}

function isFullWorkspaceRoute(pathname: string) {
  return pathname === "/editor" || isWorkspacePlayerRoute(pathname);
}

function getContentBreadcrumbs(pathname: string) {
  if (pathname === "/") return [];
  if (pathname === "/editor") return [{ label: "Home", href: "/" }, { label: "Build" }];
  if (pathname === "/learn") return [{ label: "Home", href: "/" }, { label: "Learn" }];
  if (pathname === "/challenges")
    return [{ label: "Home", href: "/" }, { label: "Challenges" }];
  if (pathname === "/progress")
    return [{ label: "Home", href: "/" }, { label: "Progress" }];
  if (pathname === "/achievements")
    return [{ label: "Home", href: "/" }, { label: "Achievements" }];
  if (pathname === "/projects")
    return [{ label: "Home", href: "/" }, { label: "Projects" }];
  if (pathname === "/import")
    return [{ label: "Home", href: "/" }, { label: "Import" }];
  if (pathname === "/export")
    return [{ label: "Home", href: "/" }, { label: "Export" }];
  if (pathname === "/roadmap")
    return [{ label: "Home", href: "/" }, { label: "Roadmap" }];
  if (pathname.startsWith("/docs"))
    return [
      { label: "Home", href: "/" },
      { label: "Docs", href: "/docs/composer" },
      { label: pathname.includes("/api") ? "API Reference" : "Composer Guide" },
    ];
  return [{ label: "Home", href: "/" }];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullWorkspace = isFullWorkspaceRoute(pathname);
  const isPlayer = isWorkspacePlayerRoute(pathname);
  const breadcrumbs = getContentBreadcrumbs(pathname);

  return (
    <ThemeProvider>
      <AppBootstrap />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className={cn(isFullWorkspace && "workspace-shell")}>
        <AppHeader />
        <main
          id="main-content"
          className={cn(
            isFullWorkspace ? "workspace-main" : "min-h-[calc(100dvh-3.5rem)]",
            isPlayer && "workspace-main--player"
          )}
        >
          {!isPlayer && breadcrumbs.length > 0 && (
            <div className="border-b border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 sm:px-4">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          )}
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
