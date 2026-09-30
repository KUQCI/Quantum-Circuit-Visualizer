export const APPETITE_LIMIT = 5;
export const APPETITE_WINDOW = 60_000;

export class Appetite {
  private meals: number[] = [];

  eat(now: number): boolean {
    this.meals = this.meals.filter((meal) => now - meal <= APPETITE_WINDOW);
    if (this.meals.length >= APPETITE_LIMIT) return false;
    this.meals.push(now);
    return true;
  }
}

export interface FeedReaction {
  text: string;
  refuse: boolean;
}

const reactions: Record<string, FeedReaction> = {
  h: {
    text: "A Hadamard! Now I'm 50% full and 50% hungry.",
    refuse: false,
  },
  x: {
    text: "Crunchy X gate. My hunger just flipped from |0⟩ to |1⟩.",
    refuse: false,
  },
  y: {
    text: "A Y gate: flipped AND a little phase-y. Tangy.",
    refuse: false,
  },
  z: {
    text: "Z gate. Tastes the same until you check the phase. Quack.",
    refuse: false,
  },
  id: {
    text: "An identity gate. Tastes like… absolutely nothing. Perfect.",
    refuse: false,
  },
  sx: {
    text: "Half an X? A light snack. √delicious.",
    refuse: false,
  },
  sxdg: {
    text: "Half an X? A light snack. √delicious.",
    refuse: false,
  },
  s: {
    text: "Mmm, phase-shifted. A little spicy, about π/4 spicy.",
    refuse: false,
  },
  sdg: {
    text: "Mmm, phase-shifted. A little spicy, about π/4 spicy.",
    refuse: false,
  },
  t: {
    text: "Mmm, phase-shifted. A little spicy, about π/4 spicy.",
    refuse: false,
  },
  tdg: {
    text: "Mmm, phase-shifted. A little spicy, about π/4 spicy.",
    refuse: false,
  },
  p: {
    text: "Mmm, phase-shifted. A little spicy, about π/4 spicy.",
    refuse: false,
  },
  rx: {
    text: "Rotational cuisine! My tummy's doing a slow spin.",
    refuse: false,
  },
  ry: {
    text: "Rotational cuisine! My tummy's doing a slow spin.",
    refuse: false,
  },
  rz: {
    text: "Rotational cuisine! My tummy's doing a slow spin.",
    refuse: false,
  },
  u: {
    text: "Rotational cuisine! My tummy's doing a slow spin.",
    refuse: false,
  },
  cx: {
    text: "A two-qubit snack! Now I can taste it in two places at once.",
    refuse: false,
  },
  cz: {
    text: "A two-qubit snack! Now I can taste it in two places at once.",
    refuse: false,
  },
  swap: {
    text: "A two-qubit snack! Now I can taste it in two places at once.",
    refuse: false,
  },
  rxx: {
    text: "A two-qubit snack! Now I can taste it in two places at once.",
    refuse: false,
  },
  rzz: {
    text: "A two-qubit snack! Now I can taste it in two places at once.",
    refuse: false,
  },
  ccx: {
    text: "A whole Toffoli? Three qubits of crunch. Quack!",
    refuse: false,
  },
  rccx: {
    text: "A whole Toffoli? Three qubits of crunch. Quack!",
    refuse: false,
  },
  rc3x: {
    text: "A whole Toffoli? Three qubits of crunch. Quack!",
    refuse: false,
  },
  measure: {
    text: "You fed me a measurement. I've collapsed… into a food coma.",
    refuse: false,
  },
  reset: {
    text: "Reset? Wait, what was I eating? Delicious, probably.",
    refuse: false,
  },
  control: {
    text: "Just a control dot? That's a crumb, friend.",
    refuse: false,
  },
  barrier: {
    text: "That's a barrier. It's a fence, not food. Quack.",
    refuse: true,
  },
};

const stuffedLines = [
  "I'm stuffed. Quack. Put the rest on the circuit.",
  "No more gates, I'm at full capacity. Like a 127-qubit chip.",
  "Burp. Sorry. This quantum duck is full.",
];

export function feedReactionFor(gateType: string): FeedReaction {
  return (
    reactions[gateType.toLowerCase()] ?? {
      text: "Nom. Not sure what that was, but it was very quantum.",
      refuse: false,
    }
  );
}

export function stuffedLine(): string {
  return (
    stuffedLines[Math.floor(Math.random() * stuffedLines.length)] ??
    stuffedLines[0]
  );
}
