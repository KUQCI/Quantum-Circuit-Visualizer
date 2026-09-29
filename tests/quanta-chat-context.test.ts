import { describe, expect, it } from "vitest";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import { buildPageContext } from "@/lib/quanta-chat/context";

describe("Quanta chat context", () => {
  it("includes page and learner lines", () => {
    const context = buildPageContext({
      path: "/progress/",
      circuit: null,
      level: 2,
      levelTitle: "Hatchling",
    });

    expect(context).toContain("Page: Progress collects");
    expect(context).toContain("Learner: level 2 (Hatchling)");
  });

  it("includes lesson title and truncates its objective", () => {
    const context = buildPageContext({
      path: "/learn/what-is-a-qubit",
      circuit: null,
      lessonTitle: "What is a Qubit?",
      lessonObjective: "x".repeat(200),
      level: 1,
      levelTitle: "Curious Egg",
    });

    expect(context).toContain("Lesson: What is a Qubit?");
    expect(context).toContain(`${"x".repeat(159)}…`);
  });

  it("includes OpenQASM only on workspace paths", () => {
    const circuit = {
      ...createEmptyCircuit("Bell", 2),
      operations: [
        {
          id: "h1",
          type: "h",
          label: "H",
          targets: ["q0"],
          controls: [],
          classicalTargets: [],
          column: 0,
        },
      ],
    };
    const editorContext = buildPageContext({
      path: "/editor",
      circuit,
      level: 1,
      levelTitle: "Curious Egg",
    });
    const homeContext = buildPageContext({
      path: "/",
      circuit,
      level: 1,
      levelTitle: "Curious Egg",
    });

    expect(editorContext).toContain("Circuit (OpenQASM):");
    expect(editorContext).toContain("h q[0];");
    expect(editorContext).not.toContain("OPENQASM");
    expect(homeContext).not.toContain("Circuit (OpenQASM):");
  });

  it("reports an empty workspace circuit", () => {
    const context = buildPageContext({
      path: "/editor",
      circuit: createEmptyCircuit(),
      level: 1,
      levelTitle: "Curious Egg",
    });

    expect(context).toContain("Circuit: empty");
  });

  it("truncates circuit and total context", () => {
    const circuit = {
      ...createEmptyCircuit("Long", 2),
      operations: Array.from({ length: 120 }, (_, index) => ({
        id: `x${index}`,
        type: "x",
        label: "X",
        targets: ["q0"],
        controls: [],
        classicalTargets: [],
        column: index,
      })),
    };
    const context = buildPageContext({
      path: "/editor",
      circuit,
      lessonTitle: "Long lesson",
      lessonObjective: "y".repeat(500),
      level: 12,
      levelTitle: "Quantum Architect",
    });

    expect(context.length).toBeLessThanOrEqual(900);
    expect(context).toContain("…");
  });
});
