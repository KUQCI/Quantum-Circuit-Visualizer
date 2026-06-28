#!/usr/bin/env node
/**
 * GitHub Pages serves 404.html for missing paths. Next.js export overwrites it
 * with the app not-found page — replace with a lightweight redirect shim that
 * adds trailing slashes and sends unknown paths to the app home.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

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
