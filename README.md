# Qiskit Visualizer

A full-stack quantum circuit editor and converter that bidirectionally transforms between visual circuit diagrams and Qiskit Python code. Built on a unified JSON intermediate representation (IR) that serves as the single source of truth for all circuit state.

## Features

- **Visual Circuit Editor** — Drag-and-drop gate placement with column-snapping grid, inspired by IBM Quantum Composer workflow
- **Qiskit Import** — Parse Qiskit Python code (text-only, no execution) into visual circuits
- **Qiskit Export** — Generate Qiskit Python code from visual circuits in real time
- **JSON Sync Layer** — Unified circuit schema connects editor, import, and export
- **Project Management** — Save, rename, duplicate, and delete circuits via localStorage
- **Sample Circuits** — Bell State, GHZ State, Simple Superposition, Quantum Teleportation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React, Tailwind CSS, shadcn/ui-style components |
| State | Zustand with localStorage persistence |
| Code Editor | Monaco Editor |
| Validation | Zod |
| Testing | Vitest |
| Translator | TypeScript port of `translator.py` (OpenQASM 2.0 parser) |

## Supported Gates (v1)

**Single-qubit:** H, X, Y, Z, S, T, RX, RY, RZ  
**Two-qubit:** CX, CZ, SWAP  
**Special:** Measure, Barrier

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Install and Run

```bash
git clone https://github.com/kuqci/quantum-circuit-visualizer.git
cd quantum-circuit-visualizer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run test` | Run Vitest unit tests |
| `npm run lint` | Run ESLint |

## Project Structure

```
/app
  /page.tsx              Home dashboard
  /editor/page.tsx       Main circuit editor (three-panel layout)
  /import/page.tsx       Qiskit code import
  /export/page.tsx       Circuit export
  /projects/page.tsx     Project management
  /roadmap/page.tsx      Development roadmap
  /api/parse-qiskit/     POST — parse Qiskit code → JSON
  /api/generate-qiskit/  POST — generate Qiskit code from JSON

/components
  /layout                App header and navigation
  /circuit               Circuit canvas and editor layout
  /code                  Monaco editor and code panel
  /gates                 Gate library and definitions
  /ui                    shadcn/ui-style components

/lib
  /circuit-schema.ts     TypeScript types + Zod validation
  /translator-core.ts    Ported QASM tokenizer, ExprParser, formatParam
  /qiskit-parser.ts      Qiskit Python → JSON adapter
  /qiskit-generator.ts   JSON → Qiskit Python adapter
  /sample-circuits.ts    Built-in example circuits

/store
  /circuit-store.ts      Zustand global state + localStorage

/tests
  /parser.test.ts        Parser and schema tests
  /generator.test.ts     Generator and round-trip tests

translator.py            Original Python QASM 2.0 ↔ Qiskit translator
```

## Architecture

```
Qiskit Python Code
       ↕  (qiskit-parser.ts / qiskit-generator.ts)
  JSON Circuit IR  ← single source of truth (circuit-schema.ts)
       ↕
  Visual Canvas  ← Zustand store + localStorage
       ↕
  OpenQASM 2.0   ← translator-core.ts (ported from translator.py)
```

The original Python translator (`translator.py`) provides OpenQASM 2.0 parsing with a `GATE_LIBRARY`, `ExprParser` for mathematical expressions (e.g. `pi/2`, `3*theta`), and `formatParam` using fraction approximation. This logic is ported to TypeScript in `lib/translator-core.ts` for serverless deployment on Vercel.

## GitHub Workflow

1. Fork or clone the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and run tests: `npm run test && npm run lint`
4. Commit: `git commit -m "Description of changes"`
5. Push: `git push origin feature/my-feature`
6. Open a Pull Request on GitHub

## Vercel Deployment

1. Push your repository to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **Import Project** and select your GitHub repository
4. Vercel auto-detects Next.js — accept the default settings:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
5. Click **Deploy**

Environment variables are configured in `next.config.ts`:

```typescript
env: {
  NEXT_PUBLIC_APP_NAME: "Qiskit Visualizer",
  NEXT_PUBLIC_APP_VERSION: "1.0.0",
}
```

No additional secrets are required for v1. The app runs entirely client-side for circuit editing, with API routes handling parse/generate on the server.

## Feature Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Qiskit code → visual circuit (import) |
| Phase 2 | ✅ Complete | Visual circuit → Qiskit code (editor + export) |
| Phase 3 | 🔜 Planned | Execution and result visualization |

## Testing

```bash
npm run test
```

Tests cover:
- Bell State Qiskit code parsing → JSON
- JSON circuit → Qiskit code generation
- Round-trip consistency (import → export → reimport)
- Unsupported syntax error handling
- Zod schema validation
- Translator core (expression parsing, pi fraction formatting)

## Security Notes

- User-submitted Qiskit code is **never executed** — it is parsed as plain text only
- No authentication or payment processing in v1
- No quantum execution — visualization and conversion only

## License

MIT
