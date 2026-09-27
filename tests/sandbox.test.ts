import { describe, expect, it } from "vitest";
import { checkCircuit } from "@/lib/learning/checker";
import {
  buildSandboxSolution,
  generateSandboxChallenge,
} from "@/lib/learning/sandbox";

describe("sandbox challenge generator", () => {
  it("is deterministic and stays within the requested XP range", () => {
    expect(generateSandboxChallenge(42)).toEqual(generateSandboxChallenge(42));
    for (let seed = 1; seed <= 200; seed += 1) {
      const challenge = generateSandboxChallenge(seed);
      expect(challenge.id).toBe(`sandbox-${seed}`);
      expect(challenge.challengeType).toBe("build");
      expect(challenge.xpReward).toBeGreaterThanOrEqual(20);
      expect(challenge.xpReward).toBeLessThanOrEqual(40);
      expect(challenge.starterCircuit.operations).toHaveLength(0);
      const solution = buildSandboxSolution(seed).circuit;
      expect(checkCircuit(solution, challenge.successCondition).success).toBe(true);
      expect(
        checkCircuit(challenge.starterCircuit, challenge.successCondition).success
      ).toBe(false);
    }
  });
});
