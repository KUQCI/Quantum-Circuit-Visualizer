import { describe, expect, it } from "vitest";
import { toPlainMath } from "@/lib/quanta-chat/plain-math";

describe("toPlainMath", () => {
  it("removes inline delimiters and converts kets", () => {
    expect(toPlainMath("The state $|0\\rangle$ is...")).toBe(
      "The state |0⟩ is..."
    );
  });

  it("converts fractions and square roots", () => {
    expect(toPlainMath("$\\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)$")).toBe(
      "1/√2(|00⟩ + |11⟩)"
    );
  });

  it("converts parenthesized math", () => {
    expect(toPlainMath("\\(\\alpha|0\\rangle + \\beta|1\\rangle\\)")).toBe(
      "α|0⟩ + β|1⟩"
    );
  });

  it("converts tensor products and daggers", () => {
    expect(toPlainMath("$H \\otimes I$ and $X^\\dagger$")).toBe(
      "H ⊗ I and X†"
    );
  });

  it("converts scripts", () => {
    expect(toPlainMath("$e^{i\\pi/2}$")).toBe("e^(iπ/2)");
    expect(toPlainMath("$a_{1}$")).toBe("a_1");
  });

  it("converts ket commands", () => {
    expect(toPlainMath("\\ket{\\psi}")).toBe("|ψ⟩");
  });

  it("converts display math", () => {
    expect(toPlainMath("$$\\theta = \\pi/4$$")).toBe("θ = π/4");
  });

  it("leaves currency and plain text unchanged", () => {
    expect(toPlainMath("Costs $5 and $10")).toBe("Costs $5 and $10");
    expect(toPlainMath("no math here")).toBe("no math here");
  });
});
