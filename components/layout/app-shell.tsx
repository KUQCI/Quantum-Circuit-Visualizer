"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppHeader } from "@/components/layout/app-header";
import { AppBootstrap } from "@/components/layout/app-bootstrap";
import { SiteFooter } from "@/components/layout/site-footer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  isEditorPath,
  isFullWorkspacePath,
  isWorkspacePlayerPath,
  normalizePath,
} from "@/lib/routes";
import { cn } from "@/lib/utils";
import { XpToast } from "@/components/learning/XpToast";
import { LevelUpDialog } from "@/components/learning/LevelUpDialog";
import { ShortcutsDialog } from "@/components/help/ShortcutsDialog";
import { AppToast } from "@/components/ui/app-toast";
import { QuantaBuddyHost } from "@/components/mascot/QuantaBuddy";
import { QuantaChat } from "@/components/mascot/QuantaChat";

function getContentBreadcrumbs(pathname: string) {
  const path = normalizePath(pathname);
  if (path === "/") return [];
  if (isEditorPath(path)) return [];
  if (path === "/learn") return [{ label: "Home", href: "/" }, { label: "Learn" }];
  if (path === "/review")
    return [
      { label: "Home", href: "/" },
      { label: "Learn", href: "/learn" },
      { label: "Quiz review" },
    ];
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
      {
        label: path.includes("/api")
          ? "API Reference"
          : path.includes("/assets")
            ? "Asset Tracker"
            : path.includes("/mascot")
              ? "Quanta Assets"
            : path.includes("/debug")
              ? "Translator Debug"
              : "Composer Guide",
      },
    ];
  return [{ label: "Home", href: "/" }];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = normalizePath(pathname);
  const isComposer = isEditorPath(path);
  const isFullWorkspace = isFullWorkspacePath(path);
  const isPlayer = isWorkspacePlayerPath(path);
  const isEmbed = path === "/embed";
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
      <XpToast />
      <QuantaBuddyHost />
      {!isEmbed && <QuantaChat />}
      <LevelUpDialog />
      <ShortcutsDialog />
      <AppToast />
      <AppBootstrap />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div
        className={cn(
          isFullWorkspace && "workspace-shell",
          isComposer && "workspace-shell--composer",
          !isFullWorkspace && "flex min-h-dvh flex-col"
        )}
      >
      {!isEmbed && <AppHeader />}
        <main
          id="main-content"
          className={cn(
            isFullWorkspace ? "workspace-main" : "min-h-0 flex-1",
            isPlayer && "workspace-main--player",
            isComposer && "workspace-main--composer",
            isEmbed && "min-h-dvh"
          )}
        >
          {!isPlayer && breadcrumbs.length > 0 && (
            <div className="border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-3 py-2 sm:px-4">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          )}
          <PageTransition>{children}</PageTransition>
        </main>
        {!isFullWorkspace && !isEmbed && <SiteFooter />}
      </div>
    </ThemeProvider>
  );
}
