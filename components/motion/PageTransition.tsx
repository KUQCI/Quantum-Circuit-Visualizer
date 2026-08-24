"use client";

import { usePathname } from "next/navigation";
import { isEditorPath, normalizePath } from "@/lib/routes";

/**
 * Soft page enter transition for marketing / academy pages.
 * Skipped on the Build composer and lesson/challenge players so panels stay snappy.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = normalizePath(pathname);
  const skip =
    isEditorPath(path) ||
    path.startsWith("/learn/") ||
    path.startsWith("/challenges/");

  if (skip) return <>{children}</>;

  return (
    <div key={pathname} className="motion-page-enter">
      {children}
    </div>
  );
}
