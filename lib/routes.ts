/** Normalize pathname for route checks (handles trailing slashes). */
export function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

/** Prefix a path with NEXT_PUBLIC_BASE_PATH for imperative navigation (e.g. location.assign). */
export function withBasePath(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalized || "/";
  return `${base}${normalized}` || base;
}

/** Whether a nav link should appear active for the current pathname. */
export function isPathActive(pathname: string, href: string): boolean {
  const path = normalizePath(pathname);
  const target = normalizePath(href.split("?")[0]);
  if (target === "/learn" || target === "/challenges") {
    return path === target || path.startsWith(`${target}/`);
  }
  return path === target;
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
