const GROUPED_COMMANDS = [
  ["braket", (value: string) => `⟨${value}⟩`],
  ["ket", (value: string) => `|${value}⟩`],
  ["bra", (value: string) => `⟨${value}|`],
  ["frac", (value: string, denominator: string) => {
    const simple = (part: string) => !/[{}\s]/.test(part);
    return simple(value) && simple(denominator)
      ? `${value}/${denominator}`
      : `(${value})/(${denominator})`;
  }],
  ["sqrt", (value: string) =>
    /^[\p{L}\p{N}]+$/u.test(value) ? `√${value}` : `√(${value})`],
  ["text", (value: string) => value],
  ["mathrm", (value: string) => value],
  ["mathbf", (value: string) => value],
] as const;

const SYMBOLS: Record<string, string> = {
  rangle: "⟩",
  langle: "⟨",
  otimes: "⊗",
  dagger: "†",
  pm: "±",
  cdot: "·",
  times: "×",
  infty: "∞",
  hbar: "ℏ",
  ldots: "…",
  dots: "…",
  cdots: "…",
  to: "→",
  rightarrow: "→",
  leftrightarrow: "↔",
  approx: "≈",
  neq: "≠",
  leq: "≤",
  geq: "≥",
  sum: "Σ",
  prod: "Π",
  vert: "|",
  mid: "|",
  lvert: "|",
  rvert: "|",
  sqrt: "√",
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  theta: "θ",
  lambda: "λ",
  mu: "μ",
  pi: "π",
  sigma: "σ",
  phi: "φ",
  psi: "ψ",
  omega: "ω",
  Delta: "Δ",
  Theta: "Θ",
  Sigma: "Σ",
  Phi: "Φ",
  Psi: "Ψ",
  Omega: "Ω",
};

const COMMAND_BOUNDARY = "(?![A-Za-z])";

function replaceGroupedCommands(value: string): string {
  let result = value;
  let changed = true;

  while (changed) {
    changed = false;
    for (const [name, replacement] of GROUPED_COMMANDS) {
      const pattern =
        name === "frac"
          ? new RegExp(
              `\\\\${name}${COMMAND_BOUNDARY}\\{([^{}]*)\\}\\{([^{}]*)\\}`,
              "g"
            )
          : new RegExp(
              `\\\\${name}${COMMAND_BOUNDARY}\\{([^{}]*)\\}`,
              "g"
            );
      const next =
        name === "frac"
          ? result.replace(pattern, (_match, numerator, denominator) =>
              replacement(numerator, denominator)
            )
          : result.replace(pattern, (_match, content) => replacement(content));
      if (next !== result) changed = true;
      result = next;
    }
  }

  return result;
}

function replaceScripts(value: string): string {
  return value
    .replace(/\^\{([^{}]*)\}/g, (_match, content) =>
      /^[\p{L}\p{N}]+$/u.test(content) ? `^${content}` : `^(${content})`
    )
    .replace(/_\{([^{}]*)\}/g, (_match, content) =>
      /^[\p{L}\p{N}]+$/u.test(content) ? `_${content}` : `_(${content})`
    );
}

function replaceSymbols(value: string): string {
  return Object.entries(SYMBOLS)
    .sort(([left], [right]) => right.length - left.length)
    .reduce(
      (result, [name, symbol]) =>
        result.replace(
          new RegExp(`\\\\${name}${COMMAND_BOUNDARY}`, "g"),
          symbol
        ),
      value
    )
    .replace(/\^†/g, "†");
}

export function toPlainMath(text: string): string {
  if (!text.includes("\\") && !text.includes("$")) return text;

  let result = text
    .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
    .replace(/\$([^\n]*?)\$/g, (match, content) =>
      /[\\^_|⟩]/.test(content) ? content : match
    )
    .replace(/\\\(([\s\S]*?)\\\)/g, "$1")
    .replace(/\\\[([\s\S]*?)\\\]/g, "$1");
  result = replaceGroupedCommands(result);
  result = replaceScripts(result);
  result = replaceSymbols(result)
    .replace(/\\left(?![A-Za-z])/g, "")
    .replace(/\\right(?![A-Za-z])/g, "")
    .replace(/\\,|\\;|\\!/g, "")
    .replace(/\\quad(?![A-Za-z])/g, " ")
    .replace(/\\displaystyle(?![A-Za-z])/g, "");

  return result === text ? result : result.replace(/ {2,}/g, " ");
}
