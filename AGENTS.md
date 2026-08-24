# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **Next.js 15 (App Router) + TypeScript** web app — the "Qiskit Visualizer",
a fully client-side quantum circuit editor. There is no backend service to run; all parsing,
code generation, and shot simulation happen in the browser. A secondary Python reference
translator (`translator.py` + `test.py`, deps in `requirements.txt`) is optional and not part
of the web app runtime.

Node 20+ and npm are expected (CI uses Node 20; the dev VM uses Node 22, which works fine).

### Services / commands
Standard scripts are defined in `package.json`; use them directly:

| Purpose | Command | Notes |
|---------|---------|-------|
| Dev server | `npm run dev` | Serves at http://localhost:3000 (`/editor`, `/import`, `/export`, `/projects`). Core product. |
| Lint | `npm run lint` | `next lint` (prints a deprecation notice; still passes). |
| Tests | `npm run test` | Vitest, ~85 tests in `tests/`. |
| Prod build (SSR) | `npm run build` | For Vercel. |
| Static export | `npm run build:pages` | GitHub Pages export into `out/` (sets `GITHUB_PAGES=true`, adds a basePath). |
| Python reference | `python3 test.py` | Optional; requires `pip install -r requirements.txt` (qiskit). Not needed for the web app. |

### Non-obvious gotchas
- **State persists in `localStorage`.** The editor (`/editor`) restores the last circuit via
  Zustand `persist`. When manually verifying "empty vs. gate placed" behavior, first run
  `localStorage.clear(); location.reload();` in the browser console, or a previously saved
  circuit (e.g. a lingering `qc.h(0)`) will make it look like the code panel is not reacting.
- **Code panel IS reactive.** Placing/removing gates on the canvas live-regenerates the code
  panel text (`components/code/use-code-sync.ts` regenerates on every circuit change). The text
  diff of one added line (`qc.x(0)`) is subtle in compressed screen recordings — trust
  full-resolution screenshots over video when checking small monospace code changes.
- The first dev-server page hit compiles routes on demand (`/editor` can take several seconds
  the first time); subsequent loads are fast.
