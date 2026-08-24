# Translator / Circuit IR Audit

> Internal audit of the client-side “backend” (parsers, generators, schema, sync).
> Production is GitHub Pages — **no server API**. All logic runs in the browser.

## Current architecture

```
Qiskit / OpenQASM / JSON text
        │
        ▼
   Parser (safe text only) ──warnings──► UI
        │
        ▼
   Canonical Circuit IR (Zod / circuit-schema.ts)
        │
        ├──► Zustand circuit store (canvas + projects + Learn)
        ├──► Generators → Qiskit / OpenQASM / Cirq / Runtime / JSON
        └──► Simulator / Learn checker
```

### Key files

| Role | Path |
|------|------|
| Canonical IR | `lib/circuit-schema.ts` |
| Gate library / expr | `lib/translator-core.ts` |
| Qiskit parse | `lib/qiskit-parser.ts` |
| Qiskit generate | `lib/qiskit-generator.ts` |
| OpenQASM | `lib/openqasm-parser.ts`, `lib/openqasm-generator.ts` |
| Cirq (export only) | `lib/cirq-generator.ts` |
| Adapters | `lib/code-adapters.ts` |
| Validation / repair | `lib/validation.ts`, `lib/circuit-guard.ts` |
| Canvas ↔ code sync | `components/code/use-code-sync.ts` |
| Store | `store/circuit-store.ts` |
| Import UI | `app/import/page.tsx` |

### What already worked

- Bell / GHZ happy-path Qiskit parse ↔ generate
- OpenQASM Bell round-trip
- Client-side only (no code execution)
- Zustand store as live IR for Build + Learn (`setActivityCircuit`)

### Known problems (found in audit)

| Priority | Issue | Impact |
|----------|--------|--------|
| P0 | SWAP generate treats op like CX (`controls[0]`) but canvas/parser use **two targets** | Canvas SWAP / imported SWAP → broken Qiskit |
| P0 | `tokenize()` infinite loop on unclosed `"` | Page hang on bad OpenQASM / params |
| P0 | Integer rotation args parsed as qubit indices (`rx(1, 0)` fails) | Common Qiskit fails |
| P1 | Gate calls use `[^)]*` — nested `sin(pi/2)` truncated | Param gates fail |
| P1 | `SUPPORTED_GATES` missing `sdg`/`tdg` | Schema vs UI drift |
| P1 | No OOB index errors — ops silently dropped later | Confusing import |
| P1 | Cirq emit invalid for n>2 (`q0, q1, ... =`) | Broken Cirq export |
| P1 | Validation warns SWAP needs controls | False warning |
| P2 | Only `qc`/`circuit` var names | Other names ignored |
| P2 | `measure([0,1],[0,1])` / `barrier(0)` incomplete | Partial Qiskit support |

## Planned fixes (this PR)

1. One IR source of truth; add `sdg`/`tdg` to supported v1 list; optional `metadata`.
2. Fix Qiskit parser: depth-aware calls, gate-arity param split, symbolic display, measure lists, barrier qubits, var-name detect, warnings, OOB checks.
3. Fix Qiskit generator: SWAP two-targets, safe measure, warnings for ungeneratable ops.
4. Fix tokenizer hang; Cirq n>2; validation semantics.
5. Expand tests + `/docs/debug` IR/warnings panel + README notes.

## Supported Qiskit (after fix)

```text
from qiskit import QuantumCircuit
qc = QuantumCircuit(n[, m])   # also circuit = ...
qc.h/x/y/z/s/sdg/t/tdg(q)
qc.rx/ry/rz(param, q)         # numeric, pi/2, theta, sin(pi/2), …
qc.cx/cz(c, t); qc.swap(a, b)
qc.measure(q, c); qc.measure([…], […])
qc.barrier(); qc.barrier(q); qc.barrier([…])
```

Unsupported lines → **warnings** (circuit still builds when possible).
Hard errors: missing `QuantumCircuit`, OOB indices, malformed measure lists.

## Debug

- Page: `/docs/debug` — live IR, validation, generate, scratch parse
- Doc: this file + README architecture section
