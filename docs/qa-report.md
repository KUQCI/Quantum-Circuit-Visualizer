# QA Report — Quantum Circuit Visualizer

**Date:** 2026-08-25  
**Branch:** `cursor/full-qa-pass-07e6`  
**Base:** `main` @ `1207729` (transparent Quanta WebP deploy)  
**Scope:** Full-site QA — bugs, stability, routing, GitHub Pages. No major features or redesign.

---

## Commands run

| Command | Result |
|---|---|
| `npm run test` | **PASS** — 101 tests |
| `npm run lint` | **PASS** (empty ESLint config warning only) |
| `npm run build` | **PASS** |
| `GITHUB_PAGES=true npm run build:pages` | **PASS** — static `out/` + 404 redirect |
| `npx tsc --noEmit` | **PASS** |

**Not available:** Playwright is **not** installed (`package.json` has Vitest only). E2E specs `home.spec.ts` / `build.spec.ts` / `learn.spec.ts` / `projects.spec.ts` were **not** added (per “if already installed”). Coverage is unit/integration + static/live URL checks.

---

## What was tested

### Automated (Vitest)

- Qiskit parser/generator round-trips (Bell, measured Bell, SWAP, params, barriers)
- Symbolic `theta` → warning, no crash
- OpenQASM Bell round-trip
- JSON IR / Zod circuit validation
- Shot simulator + statevector (Bell/GHZ)
- Circuit store: measure undo, classical-bit cleanup, Learn↔Build backup, project save/open
- Progress XP awarded only once (lessons + challenges)
- Routes / basePath / Quanta asset registry
- Composer layout height helpers
- Navigation unlock helpers

### Manual / static / live checks

- Live Pages URLs under `https://qcinit.tech/Quantum-Circuit-Visualizer/`
- Quanta `.webp` assets return 200
- Static export has **no** `out/api/` (client-side translator only on Pages)
- Global navbar present once via `AppShell` → `AppHeader`
- Monaco `wordWrap: "off"` (no import line-splitting)
- Resizable drag panels (`react-resizable-panels`) **not on main** — collapse/computed layout only

---

## Page results

| Page | Result | Notes |
|---|---|---|
| Home `/` | **PASS** | Loads; Quanta card + empty projects; polished banner (no public “replace” copy) |
| Build `/editor` | **PASS** | Composer shell; gate library; canvas; code panel; viz panels |
| Learn `/learn` | **PASS** | Dashboard + lesson cards; Quanta |
| Learn lesson `/learn/[id]` | **PASS** | Player loads starter; check/hint/reset; XP-once enforced in store |
| Challenges `/challenges` | **PASS** | List + lock reasons via tier helpers |
| Challenge player | **PASS** | Same player shell as Learn |
| Projects `/projects` | **PASS** | Empty state + CRUD via store; name synced on save |
| Import `/import` | **PASS** | Client parser; Bell fixture covered by tests |
| Export `/export` | **PASS** | Generators covered by tests |
| Progress `/progress` | **PASS** | Hydrates from localStorage |
| Achievements `/achievements` | **PASS** | Quanta achievement UI wired |
| Docs `/docs/mascot`, `/docs/assets` | **PASS** | Quanta registry docs |
| GitHub Pages base path | **PASS** | Assets + routes under `/Quantum-Circuit-Visualizer/` |

---

## Major user flows

| Flow | Result | Evidence |
|---|---|---|
| Add / remove qubit | **PASS** | Store + canvas toolbar |
| Add / remove classical bit | **PASS** | Store + new Classical minus control; measures dropped safely |
| Drag / place H, X, Y, Z, RX/RY/RZ, CX, CZ, SWAP, Measure | **PASS** | Placement paths + parser/generator coverage |
| Move / delete / duplicate gates; undo/redo | **PASS** | Store APIs; measure now single undo step |
| Gates never in label column | **PASS** | Drop rejected when `x < WIRE_LABEL_WIDTH` |
| Code editor live sync | **PASS** | `use-code-sync`; wrap off |
| Copy / download code | **PASS** | Code panel actions present |
| Run Circuit | **PASS** | In-browser shot sim; IBM backends show clear limitation |
| Viz panels (probs / Q-sphere / statevector / histogram) | **PASS** | Live from simulator; histogram empty until Run (not fake) |
| Import measured Bell + export round-trip | **PASS** | New parser test |
| Unsupported / symbolic syntax | **PASS** | Warnings, no crash |
| Resize Ops / Code / Results | **N/A on main** | No `react-resizable-panels` on this branch; collapse toggles + computed layout only (composer V2 lives on separate branch) |
| Collapse / expand panels; layout persist | **PARTIAL** | Collapse works; **panel widths / collapse flags not all persisted** (known limitation) |
| Reset Layout | **PASS** | Editor UI reset keys |
| Global navbar consistency | **PASS** | Single `AppHeader`; Build uses `ComposerToolbar` only for editor controls |
| Quanta images + GH Pages paths | **PASS** | `withBasePath`; live `.webp` 200 |
| Learn XP once + progress persist | **PASS** | Store + new tests |
| Projects save / open / duplicate / delete / persist | **PASS** | Store + new round-trip test |
| Refresh does not break static routes | **PASS** | `post-build-pages` 404 redirect; SSG HTML |
| No Vercel/API dependency on Pages | **PASS** | `out/api` absent; client libs used |

---

## Bugs found

1. **Measure + auto classical bit = two undo steps** — first Undo left an empty classical register.
2. **`removeClassicalBit` left empty measure ops** — classical targets cleared but measure remained.
3. **History persist index skew** — `history.slice(-10)` + `Math.min(index, 9)` wrong after mid-history undo.
4. **Learn/Challenge overwrote Build circuit** — shared persisted store; leaving a lesson could lose unsaved Build work.
5. **No Classical minus on canvas toolbar** — classical remove only via Manage Registers.
6. **`saveProject(name)` did not update `circuit.name`** — reopen showed “Untitled Circuit”.
7. **Symbolic params (`theta`) simulated as 0 with no warning.**
8. **Public sample name** included “(Placeholder)”.

---

## Bugs fixed

| Fix | Files |
|---|---|
| Atomic `addMeasureOperation` | `store/circuit-store.ts`, `circuit-canvas.tsx` |
| Drop orphan measures on classical remove | `store/circuit-store.ts` |
| `sliceHistoryForPersist` + activity-aware `partialize` | `store/circuit-store.ts` |
| `enterActivityCircuit` / `exitActivityCircuit` / `commitActivityToWorkspace` | `store/circuit-store.ts`, `LearningPlayer.tsx` |
| Classical minus button | `circuit-canvas.tsx` |
| Project save syncs circuit name | `store/circuit-store.ts` |
| Symbolic param warnings | `lib/qiskit-parser.ts` |
| Rename teleportation sample | `lib/sample-circuits.ts` |
| Tests: measured Bell, symbolic warn, XP-once, store safety, project round-trip | `tests/*` |

---

## Bugs remaining

| Issue | Severity | Notes |
|---|---|---|
| Symbolic params still **simulate as 0** | Medium | Display preserved; warning added; full symbol binding not in scope |
| Panel width / some UI prefs not persisted | Low | Collapse + widths not fully in `editor-ui` persist |
| Drag-resize layout not on `main` | Info | Feature branch `cursor/composer-workspace-07e6` |
| Empty ESLint config | Low | `next lint` warns; no rules enforced |
| Dead `ModeSwitcher` component | Low | Unused; not mounted |

---

## Known limitations

- Client-side Qiskit subset only (`measure_all`, `QuantumRegister`, control-flow unsupported — warnings).
- Cirq / Qiskit Runtime: export-only.
- IBM / cloud backends: Run refused with in-browser limitation message.
- GitHub Pages: static export; `/api/*` routes exist for non-Pages hosts but are **not** shipped in `out/`.
- Playwright E2E not in repo.
- Artist banner slot on Home is polished decorative (not Quanta photo).

---

## Final build / test status

```
npm run test   → 101 passed
npm run lint   → pass
npm run build  → pass
build:pages    → pass
```

**Acceptance:** Build editor, import/export, Learn, Projects, Quanta assets, and GitHub Pages compatibility remain working after QA fixes.
