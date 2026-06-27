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
    title: "Execution & Advanced Visualization",
    status: "complete" as const,
    description:
      "Run circuits on local simulators with shot-based sampling, visualize measurement histograms, and inspect enhanced statevector data. IBM backend export paths are included for cloud and hardware execution.",
    features: [
      "Local simulator integration with configurable shots",
      "Measurement result histograms (classical register aware)",
      "Enhanced statevector table (real, imag, phase, probability)",
      "Backend selection (local, IBM Qasm Simulator, IBM hardware)",
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="page-container max-w-3xl">
      <div className="page-header mb-10 text-center">
        <h1 className="page-title text-3xl">Roadmap</h1>
        <p className="page-description">
          Quantum Circuit Visualizer — editing and conversion
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-[var(--color-brand)]" />
            Architecture Foundation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--color-muted-foreground)]">
          <p className="leading-relaxed">
            All circuit state flows through a unified JSON intermediate
            representation (IR). This schema is the single source of truth
            connecting the visual editor, Qiskit import/export, and future
            execution layer.
          </p>
          <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4 font-mono text-xs">
            Qiskit Code ↔ JSON Circuit IR ↔ Visual Canvas
          </div>
          <p className="mt-4 leading-relaxed">
            The existing Python translator (ported to TypeScript) handles
            OpenQASM 2.0 parsing, mathematical expression evaluation (e.g.{" "}
            <code className="rounded bg-[var(--color-secondary)] px-1.5 py-0.5 text-[var(--color-foreground)]">
              pi/2
            </code>
            ), and gate library mapping — ensuring consistent bidirectional
            conversion.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {phases.map((phase) => (
          <Card key={phase.phase}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {phase.status === "complete" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-success)]" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]" />
                )}
                <div>
                  <CardDescription>Phase {phase.phase}</CardDescription>
                  <CardTitle className="text-lg">{phase.title}</CardTitle>
                </div>
                <span
                  className={
                    phase.status === "complete"
                      ? "status-badge-complete ml-auto"
                      : "status-badge-planned ml-auto"
                  }
                >
                  {phase.status === "complete" ? "Complete" : "Planned"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {phase.description}
              </p>
              <ul className="space-y-1.5">
                {phase.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand)]" />
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
