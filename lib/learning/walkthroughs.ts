import type { Circuit } from "@/lib/circuit-schema";
import { bellStateCircuit, hzhCircuit } from "@/lib/sample-circuits";

export interface WalkthroughStep {
  title: string;
  text: string;
}

export interface Walkthrough {
  id: "bell" | "hzh";
  title: string;
  description: string;
  circuit: Circuit;
  steps: WalkthroughStep[];
}

export const WALKTHROUGHS: Walkthrough[] = [
  {
    id: "bell",
    title: "Bell-state entanglement",
    description: "See a Hadamard and CX create a two-qubit entangled state.",
    circuit: bellStateCircuit,
    steps: [
      {
        title: "Create superposition",
        text: "Step through the H gate and watch q0 become a 50/50 superposition.",
      },
      {
        title: "Create entanglement",
        text: "The CX correlates q1 with q0, producing the Bell state.",
      },
      {
        title: "Try changing it",
        text: "Delete the CX gate and step to the end — the card now reports a product state and |01⟩/|10⟩ are no longer correlated; press Undo to restore it.",
      },
    ],
  },
  {
    id: "hzh",
    title: "Why phase matters",
    description: "Use HZH to see a hidden phase become visible through interference.",
    circuit: hzhCircuit,
    steps: [
      {
        title: "Begin in superposition",
        text: "The first H creates equal probabilities for |0⟩ and |1⟩.",
      },
      {
        title: "Flip the phase",
        text: "After step 2 probabilities are unchanged (50/50), but the |1⟩ phase flipped 0°→180°.",
      },
      {
        title: "Interference reveals it",
        text: "Step 3 shows the interference result |1⟩ — that's why phase matters.",
      },
    ],
  },
];

export function getWalkthrough(
  id: string | null | undefined
): Walkthrough | undefined {
  return WALKTHROUGHS.find((walkthrough) => walkthrough.id === id);
}
