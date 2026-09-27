import type { LayoutTier } from "@/lib/composer-layout";

export interface BuildTourStep {
  id: "gates" | "canvas" | "inspector" | "code" | "run";
  title: string;
  body: string;
  narrowTab?: "gates" | "inspector" | "code";
}

export function getTourSteps(layoutTier: LayoutTier): BuildTourStep[] {
  const narrow = layoutTier !== "desktop";
  return [
    {
      id: "gates",
      title: "Gates",
      body: "Pick a gate here. Click one, then click a wire — or drag it over.",
      narrowTab: narrow ? "gates" : undefined,
    },
    {
      id: "canvas",
      title: "Canvas",
      body: "Your circuit lives here. Each line is a qubit; time runs left → right.",
    },
    {
      id: "inspector",
      title: "Inspector",
      body: "Select any gate to edit its targets, controls and angles.",
      narrowTab: narrow ? "inspector" : undefined,
    },
    {
      id: "code",
      title: "Code",
      body: "Every change is mirrored as Qiskit / OpenQASM / Cirq — edit either side.",
      narrowTab: narrow ? "code" : undefined,
    },
    {
      id: "run",
      title: "Run",
      body: "Hit Run to simulate. You'll see probabilities and measurement counts below.",
    },
  ];
}
