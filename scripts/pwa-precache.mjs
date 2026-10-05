import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const MAX_FILE_BYTES = 1.5 * 1024 * 1024;

function shouldPrecache(path, size) {
  if (size > MAX_FILE_BYTES) return false;

  const normalized = path.replaceAll(sep, "/");
  if (
    normalized === "404.html" ||
    normalized.startsWith("404/") ||
    normalized === "sw.js" ||
    /\.(?:mp4|webm|mov|mp3|map)$/i.test(normalized)
  ) {
    return false;
  }

  return (
    normalized.endsWith(".html") ||
    normalized.startsWith("_next/static/") ||
    normalized.endsWith(".txt") ||
    normalized.startsWith("assets/") ||
    normalized.startsWith("icons/") ||
    normalized === "manifest.webmanifest" ||
    /(?:^|\/)(?:favicon[^/]*\.(?:ico|png)|(?:apple-)?icon[^/]*\.png)$/i.test(
      normalized
    )
  );
}

function listFiles(directory, outDir) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) return listFiles(absolutePath, outDir);
      if (!entry.isFile()) return [];
      return [{ absolutePath, relativePath: relative(outDir, absolutePath) }];
    });
}

function urlFor(relativePath, basePath) {
  const path = relativePath.replaceAll(sep, "/");
  const base = basePath.replace(/\/+$/, "");
  const encodePath = (value) =>
    value
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

  if (path === "index.html") return `${base}/`;
  if (path.endsWith("/index.html")) {
    return `${base}/${encodePath(path.slice(0, -"index.html".length))}`;
  }
  return `${base}/${encodePath(path)}`;
}

export function buildPrecacheList(outDir, basePath) {
  const files = listFiles(outDir, outDir)
    .map((file) => ({
      ...file,
      size: statSync(file.absolutePath).size,
    }))
    .filter((file) => shouldPrecache(file.relativePath, file.size))
    .sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath)
    );
  const hash = createHash("sha256");
  let totalBytes = 0;

  for (const file of files) {
    hash.update(file.relativePath.replaceAll(sep, "/"));
    hash.update("\0");
    hash.update(readFileSync(file.absolutePath));
    totalBytes += file.size;
  }

  return {
    urls: files.map((file) => urlFor(file.relativePath, basePath)).sort(),
    version: hash.digest("hex").slice(0, 12),
    totalBytes,
  };
}
