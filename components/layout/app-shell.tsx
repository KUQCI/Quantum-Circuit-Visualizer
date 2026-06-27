"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppHeader } from "@/components/layout/app-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditor = pathname === "/editor";

  return (
    <ThemeProvider>
      {!isEditor && <AppHeader />}
      {children}
    </ThemeProvider>
  );
}
