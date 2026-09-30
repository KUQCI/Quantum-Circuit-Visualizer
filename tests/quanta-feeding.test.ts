import { describe, expect, it } from "vitest";
import {
  APPETITE_LIMIT,
  APPETITE_WINDOW,
  Appetite,
  feedReactionFor,
  stuffedLine,
} from "@/lib/quanta-buddy/feeding";

describe("Quanta feeding", () => {
  it("allows five meals, refuses the sixth within the window, and accepts after", () => {
    const appetite = new Appetite();
    for (let now = 0; now < APPETITE_LIMIT; now += 1) {
      expect(appetite.eat(now)).toBe(true);
    }
    expect(appetite.eat(APPETITE_LIMIT)).toBe(false);
    expect(appetite.eat(APPETITE_WINDOW + 1)).toBe(true);
  });

  it("matches gate reactions without regard to case", () => {
    expect(feedReactionFor("H")).toEqual({
      text: "A Hadamard! Now I'm 50% full and 50% hungry.",
      refuse: false,
    });
  });

  it("reacts to two-qubit gates", () => {
    expect(feedReactionFor("cx").text).toBe(
      "A two-qubit snack! Now I can taste it in two places at once."
    );
  });

  it("refuses barriers", () => {
    expect(feedReactionFor("barrier")).toEqual({
      text: "That's a barrier. It's a fence, not food. Quack.",
      refuse: true,
    });
  });

  it("uses a fallback for unknown gate types", () => {
    expect(feedReactionFor("mystery")).toEqual({
      text: "Nom. Not sure what that was, but it was very quantum.",
      refuse: false,
    });
  });

  it("returns one of the full-capacity reactions", () => {
    expect(
      [
        "I'm stuffed. Quack. Put the rest on the circuit.",
        "No more gates, I'm at full capacity. Like a 127-qubit chip.",
        "Burp. Sorry. This quantum duck is full.",
      ]
    ).toContain(stuffedLine());
  });
});
