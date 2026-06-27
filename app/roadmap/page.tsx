import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Circle, Layers } from "lucide-react";

const phases = [
  {
    phase: 1,
    title: "Qiskit Code → Visual Circuit",
    status: "complete" as const,
    description:
      "Import Qiskit Python code and parse it into an interactive visual circuit diagram. Safe text-only parsing with no code execution.",
    features: [
      "Qiskit Python code parser",
      "Gate detection and validation",
      "Circuit property summary",
      "Open parsed circuits in the editor",
    ],
  },
  {
    phase: 2,
    title: "Visual Circuit → Qiskit Code",
    status: "complete" as const,
    description:
      "Build circuits visually with drag-and-drop gate placement, then export to Qiskit Python code in real time.",
    features: [
      "Drag-and-drop gate library",
      "Column-snapping circuit canvas",
      "Live Qiskit code generation",
      "Project persistence with localStorage",
      "Undo/redo support",
    ],
  },
  {
    phase: 3,
    title: "Execution & Result Visualization",
    status: "planned" as const,
    description:
      "Run circuits on quantum simulators or hardware and visualize measurement results, state vectors, and probability distributions.",
    features: [
      "Simulator integration",
      "Measurement result charts",
      "State vector visualization",
      "Backend selection",
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">Roadmap</h1>
        <p className="mt-3 text-[var(--color-muted-foreground)]">
          Qiskit Visualizer — quantum circuit editing and conversion
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-indigo-600" />
            Architecture Foundation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--color-muted-foreground)]">
          <p>
            All circuit state flows through a unified JSON intermediate
            representation (IR). This schema is the single source of truth
            connecting the visual editor, Qiskit import/export, and future
            execution layer.
          </p>
          <div className="mt-4 rounded-md bg-[var(--color-muted)] p-4 font-mono text-xs">
            Qiskit Code ↔ JSON Circuit IR ↔ Visual Canvas
          </div>
          <p className="mt-4">
            The existing Python translator (ported to TypeScript) handles
            OpenQASM 2.0 parsing, mathematical expression evaluation (e.g.{" "}
            <code className="rounded bg-slate-100 px-1">pi/2</code>), and
            gate library mapping — ensuring consistent bidirectional conversion.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {phases.map((phase) => (
          <Card key={phase.phase}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {phase.status === "complete" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                )}
                <div>
                  <CardDescription>Phase {phase.phase}</CardDescription>
                  <CardTitle className="text-lg">{phase.title}</CardTitle>
                </div>
                <span
                  className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    phase.status === "complete"
                      ? "bg-green-100 text-green-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {phase.status === "complete" ? "Complete" : "Planned"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
                {phase.description}
              </p>
              <ul className="space-y-1">
                {phase.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="h-1 w-1 rounded-full bg-indigo-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
