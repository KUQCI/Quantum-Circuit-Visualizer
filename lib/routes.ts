/** Normalize pathname for route checks (handles trailing slashes). */
export function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

export function isEditorPath(pathname: string): boolean {
  return normalizePath(pathname) === "/editor";
}

export function isFullWorkspacePath(pathname: string): boolean {
  return (
    isEditorPath(pathname) ||
    /^\/learn\/[^/]+$/.test(normalizePath(pathname)) ||
    /^\/challenges\/[^/]+$/.test(normalizePath(pathname))
  );
}

export function isWorkspacePlayerPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return /^\/learn\/[^/]+$/.test(path) || /^\/challenges\/[^/]+$/.test(path);
}
