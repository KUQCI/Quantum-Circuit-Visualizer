"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppHeader } from "@/components/layout/app-header";
import { AppBootstrap } from "@/components/layout/app-bootstrap";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import {
  isEditorPath,
  isFullWorkspacePath,
  isWorkspacePlayerPath,
  normalizePath,
} from "@/lib/routes";
import { cn } from "@/lib/utils";

function getContentBreadcrumbs(pathname: string) {
  const path = normalizePath(pathname);
  if (path === "/") return [];
  if (isEditorPath(path)) return [];
  if (path === "/learn") return [{ label: "Home", href: "/" }, { label: "Learn" }];
  if (path === "/challenges")
    return [{ label: "Home", href: "/" }, { label: "Challenges" }];
  if (path === "/progress")
    return [{ label: "Home", href: "/" }, { label: "Progress" }];
  if (path === "/achievements")
    return [{ label: "Home", href: "/" }, { label: "Achievements" }];
  if (path === "/projects")
    return [{ label: "Home", href: "/" }, { label: "Projects" }];
  if (path === "/import")
    return [{ label: "Home", href: "/" }, { label: "Import" }];
  if (path === "/export")
    return [{ label: "Home", href: "/" }, { label: "Export" }];
  if (path === "/roadmap")
    return [{ label: "Home", href: "/" }, { label: "Roadmap" }];
  if (path.startsWith("/docs"))
    return [
      { label: "Home", href: "/" },
      { label: "Docs", href: "/docs/composer" },
      { label: path.includes("/api") ? "API Reference" : "Composer Guide" },
    ];
  return [{ label: "Home", href: "/" }];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = normalizePath(pathname);
  const isComposer = isEditorPath(path);
  const isFullWorkspace = isFullWorkspacePath(path);
  const isPlayer = isWorkspacePlayerPath(path);
  const breadcrumbs = getContentBreadcrumbs(path);

  useEffect(() => {
    const clearWorkspaceAttrs = () => {
      document.documentElement.removeAttribute("data-workspace");
      document.documentElement.removeAttribute("data-composer");
    };

    if (!isFullWorkspace) {
      clearWorkspaceAttrs();
      return clearWorkspaceAttrs;
    }

    document.documentElement.setAttribute("data-workspace", "true");
    if (isComposer) {
      document.documentElement.setAttribute("data-composer", "true");
    } else {
      document.documentElement.removeAttribute("data-composer");
    }
    return clearWorkspaceAttrs;
  }, [isFullWorkspace, isComposer]);

  return (
    <ThemeProvider>
      <AppBootstrap />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div
        className={cn(
          isFullWorkspace && "workspace-shell",
          isComposer && "workspace-shell--composer"
        )}
      >
        {!isComposer && <AppHeader />}
        <main
          id="main-content"
          className={cn(
            isFullWorkspace ? "workspace-main" : "min-h-[calc(100dvh-3.5rem)]",
            isPlayer && "workspace-main--player",
            isComposer && "workspace-main--composer"
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
