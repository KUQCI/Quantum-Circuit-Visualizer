import type { Circuit } from "@/lib/circuit-schema";
import { generateOpenQasm } from "@/lib/openqasm-generator";
import { isFullWorkspacePath, normalizePath } from "@/lib/routes";
import { pageHelpFor } from "@/lib/quanta-buddy/persona";
import { circuitHasContent } from "@/store/circuit-store";

const MAX_CONTEXT = 900;
const MAX_QASM = 600;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function circuitContext(circuit: Circuit): string {
  if (!circuitHasContent(circuit)) return "Circuit: empty";
  const result = generateOpenQasm(circuit);
  if (!result.success) return "Circuit: unavailable";
  const lines = result.code
    .split("\n")
    .filter(
      (line) =>
        line.trim() !== "" &&
        !line.startsWith("OPENQASM") &&
        !line.startsWith("include ")
    );
  return `Circuit (OpenQASM):\n${truncate(lines.join("\n"), MAX_QASM)}`;
}

export function buildPageContext(input: {
  path: string;
  circuit: Circuit | null;
  lessonTitle?: string;
  lessonObjective?: string;
  level: number;
  levelTitle: string;
}): string {
  const path = normalizePath(input.path);
  const lines = [
    `Page: ${pageHelpFor(path)}`,
    `Learner: level ${input.level} (${input.levelTitle})`,
  ];

  if (input.lessonTitle) {
    const objective = truncate(input.lessonObjective ?? "", 160);
    lines.push(`Lesson: ${input.lessonTitle} — ${objective}`);
  }

  if (input.circuit && isFullWorkspacePath(path)) {
    lines.push(circuitContext(input.circuit));
  }

  return truncate(lines.join("\n"), MAX_CONTEXT);
}
