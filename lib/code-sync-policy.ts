import type { CodeParseResult } from "./code-adapters";
import type { Circuit } from "./circuit-schema";

export type CodeSyncDecision =
  | { kind: "apply"; circuit: Circuit; warnings: string[] }
  | { kind: "blocked"; circuit: Circuit; warnings: string[] }
  | { kind: "error"; error: string; warnings: string[] };

const UNBOUND_PARAMETER_WARNING =
  /^(?:Line \d+:\s*)?unbound parameter ".+" — bind a value before simulating$/;

export function decideCodeSync(
  result: CodeParseResult,
  validate: (
    circuit: Circuit
  ) => { valid: boolean; errors: string[]; circuit: Circuit }
): CodeSyncDecision {
  const warnings = result.warnings ?? [];
  if (!result.success || !result.circuit) {
    return {
      kind: "error",
      error: result.error ?? "Parse failed",
      warnings,
    };
  }

  const validated = validate(result.circuit);
  if (!validated.valid) {
    return {
      kind: "error",
      error: validated.errors.join("; "),
      warnings,
    };
  }

  const hasBlockingWarning = warnings.some(
    (warning) => !UNBOUND_PARAMETER_WARNING.test(warning)
  );
  return {
    kind: hasBlockingWarning ? "blocked" : "apply",
    circuit: validated.circuit,
    warnings,
  };
}
