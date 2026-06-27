"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppHeader } from "@/components/layout/app-header";
import { cn } from "@/lib/utils";

function isWorkspacePlayerRoute(pathname: string) {
  return (
    /^\/learn\/[^/]+$/.test(pathname) ||
    /^\/challenges\/[^/]+$/.test(pathname)
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditor = pathname === "/editor";
  const isWorkspacePlayer = isWorkspacePlayerRoute(pathname);

  if (isEditor) {
    return (
      <ThemeProvider>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <main id="main-content">{children}</main>
      </ThemeProvider>
    );
  }

  if (isWorkspacePlayer) {
    return (
      <ThemeProvider>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div className="workspace-shell">
          <AppHeader variant="compact" />
          <main id="main-content" className="workspace-main">
            {children}
          </main>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <AppHeader variant="default" />
      <main id="main-content" className={cn(isEditor && "min-h-0")}>
        {children}
      </main>
    </ThemeProvider>
  );
}
