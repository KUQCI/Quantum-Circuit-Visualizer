#!/usr/bin/env node
/**
 * GitHub Pages serves 404.html for missing paths. Next.js export overwrites it
 * with the app not-found page — replace with a lightweight redirect shim that
 * adds trailing slashes and sends unknown paths to the app home.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildPrecacheList } from "./pwa-precache.mjs";

const basePath = process.env.GITHUB_REPOSITORY_NAME
  ? `/${process.env.GITHUB_REPOSITORY_NAME}`
  : "/Quantum-Circuit-Visualizer";

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Redirecting…</title>
    <script>
      (function () {
        var base = ${JSON.stringify(basePath)};
        var path = location.pathname;
        var search = location.search;
        var hash = location.hash;

        if (path.startsWith(base)) {
          var rest = path.slice(base.length);
          if (rest && !rest.endsWith("/") && rest.indexOf(".") === -1) {
            location.replace(base + rest + "/" + search + hash);
            return;
          }
        }

        location.replace(base + "/" + search + hash);
      })();
    </script>
  </head>
  <body></body>
</html>
`;

writeFileSync(join(process.cwd(), "out", "404.html"), html, "utf8");
console.log("Wrote GitHub Pages 404 redirect to out/404.html");

const outDir = join(process.cwd(), "out");
const { urls, version, totalBytes } = buildPrecacheList(outDir, basePath);
const serviceWorker = readFileSync(
  new URL("./sw.template.js", import.meta.url),
  "utf8"
)
  .replace("__QCV_BASE__", JSON.stringify(basePath))
  .replace("__QCV_VERSION__", JSON.stringify(version))
  .replace("__QCV_PRECACHE__", JSON.stringify(urls));

writeFileSync(join(outDir, "sw.js"), serviceWorker, "utf8");
console.log(
  `Wrote out/sw.js with ${urls.length} precache URLs (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`
);
