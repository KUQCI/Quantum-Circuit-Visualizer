/**
 * TypeScript port of translator.py — QASM 2.0 tokenizer, expression parser,
 * and parameter formatting. Mirrors the Python GATE_LIBRARY and ExprParser.
 */

export interface Token {
  kind: "ID" | "NUM" | "STR" | "SYM" | "EOF";
  value: string;
  pos: number;
}

const SYMBOLS = new Set([
  "{",
  "}",
  "(",
  ")",
  "[",
  "]",
  ",",
  ";",
  "+",
  "-",
  "*",
  "/",
  "^",
  "==",
  "=",
  "->",
]);

export const GATE_LIBRARY: Record<
  string,
  { nQubits: number; nParams: number; label: string }
> = {
  id: { nQubits: 1, nParams: 0, label: "ID" },
  x: { nQubits: 1, nParams: 0, label: "X" },
  y: { nQubits: 1, nParams: 0, label: "Y" },
  z: { nQubits: 1, nParams: 0, label: "Z" },
  h: { nQubits: 1, nParams: 0, label: "H" },
  s: { nQubits: 1, nParams: 0, label: "S" },
  sdg: { nQubits: 1, nParams: 0, label: "S†" },
  t: { nQubits: 1, nParams: 0, label: "T" },
  tdg: { nQubits: 1, nParams: 0, label: "T†" },
  sx: { nQubits: 1, nParams: 0, label: "SX" },
  sxdg: { nQubits: 1, nParams: 0, label: "SX†" },
  rx: { nQubits: 1, nParams: 1, label: "RX" },
  ry: { nQubits: 1, nParams: 1, label: "RY" },
  rz: { nQubits: 1, nParams: 1, label: "RZ" },
  p: { nQubits: 1, nParams: 1, label: "P" },
  u1: { nQubits: 1, nParams: 1, label: "U1" },
  u2: { nQubits: 1, nParams: 2, label: "U2" },
  u3: { nQubits: 1, nParams: 3, label: "U3" },
  u: { nQubits: 1, nParams: 3, label: "U" },
  cx: { nQubits: 2, nParams: 0, label: "CX" },
  cy: { nQubits: 2, nParams: 0, label: "CY" },
  cz: { nQubits: 2, nParams: 0, label: "CZ" },
  ch: { nQubits: 2, nParams: 0, label: "CH" },
  swap: { nQubits: 2, nParams: 0, label: "SWAP" },
  csx: { nQubits: 2, nParams: 0, label: "CSX" },
  crz: { nQubits: 2, nParams: 1, label: "CRZ" },
  cu1: { nQubits: 2, nParams: 1, label: "CU1" },
  rxx: { nQubits: 2, nParams: 1, label: "RXX" },
  rzz: { nQubits: 2, nParams: 1, label: "RZZ" },
  cu3: { nQubits: 2, nParams: 3, label: "CU3" },
  cu: { nQubits: 2, nParams: 4, label: "CU" },
  ccx: { nQubits: 3, nParams: 0, label: "CCX" },
  cswap: { nQubits: 3, nParams: 0, label: "CSWAP" },
};

const FUNCS: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  exp: Math.exp,
  ln: Math.log,
  sqrt: Math.sqrt,
};

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];

    if (" \t\r\n".includes(ch)) {
      i++;
      continue;
    }

    if (text.startsWith("//", i)) {
      const nl = text.indexOf("\n", i);
      i = nl === -1 ? n : nl + 1;
      continue;
    }

    if (ch === '"') {
      const j = text.indexOf('"', i + 1);
      tokens.push({ kind: "STR", value: text.slice(i + 1, j), pos: i });
      i = j + 1;
      continue;
    }

    if (ch.match(/\d/) || (ch === "." && i + 1 < n && text[i + 1].match(/\d/))) {
      let j = i;
      while (j < n && (text[j].match(/\d/) || text[j] === ".")) j++;
      if (j < n && "eE".includes(text[j])) {
        j++;
        if (j < n && "+-".includes(text[j])) j++;
        while (j < n && text[j].match(/\d/)) j++;
      }
      tokens.push({ kind: "NUM", value: text.slice(i, j), pos: i });
      i = j;
      continue;
    }

    if (ch.match(/[a-zA-Z_]/)) {
      let j = i;
      while (j < n && (text[j].match(/[\w]/) ?? false)) j++;
      tokens.push({ kind: "ID", value: text.slice(i, j), pos: i });
      i = j;
      continue;
    }

    if (text.startsWith("->", i)) {
      tokens.push({ kind: "SYM", value: "->", pos: i });
      i += 2;
      continue;
    }
    if (text.startsWith("==", i)) {
      tokens.push({ kind: "SYM", value: "==", pos: i });
      i += 2;
      continue;
    }
    if (SYMBOLS.has(ch)) {
      tokens.push({ kind: "SYM", value: ch, pos: i });
      i++;
      continue;
    }

    throw new SyntaxError(`Unexpected character ${JSON.stringify(ch)} at position ${i}`);
  }

  tokens.push({ kind: "EOF", value: "", pos: n });
  return tokens;
}

export class ExprParser {
  private i = 0;

  constructor(private toks: Token[]) {}

  parse(): number {
    const value = this.expr();
    if (this.peek().kind !== "EOF") {
      throw new SyntaxError(`Unexpected trailing token ${JSON.stringify(this.peek().value)}`);
    }
    return value;
  }

  private peek(): Token {
    return this.toks[this.i];
  }

  private advance(): Token {
    return this.toks[this.i++];
  }

  private expect(sym: string): void {
    const tok = this.advance();
    if (tok.value !== sym) {
      throw new SyntaxError(`Expected ${JSON.stringify(sym)}, got ${JSON.stringify(tok.value)}`);
    }
  }

  private expr(): number {
    let value = this.term();
    while (this.peek().value === "+" || this.peek().value === "-") {
      const op = this.advance().value;
      const rhs = this.term();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  private term(): number {
    let value = this.power();
    while (this.peek().value === "*" || this.peek().value === "/") {
      const op = this.advance().value;
      const rhs = this.power();
      value = op === "*" ? value * rhs : value / rhs;
    }
    return value;
  }

  private power(): number {
    let value = this.unary();
    if (this.peek().value === "^") {
      this.advance();
      value = value ** this.power();
    }
    return value;
  }

  private unary(): number {
    if (this.peek().value === "-") {
      this.advance();
      return -this.unary();
    }
    if (this.peek().value === "+") {
      this.advance();
      return this.unary();
    }
    return this.atom();
  }

  private atom(): number {
    const tok = this.advance();
    if (tok.kind === "NUM") return parseFloat(tok.value);
    if (tok.kind === "ID" && tok.value === "pi") return Math.PI;
    if (tok.kind === "ID" && tok.value in FUNCS) {
      this.expect("(");
      const inner = this.expr();
      this.expect(")");
      return FUNCS[tok.value](inner);
    }
    if (tok.value === "(") {
      const inner = this.expr();
      this.expect(")");
      return inner;
    }
    throw new SyntaxError(`Unexpected token ${JSON.stringify(tok.value)} in expression`);
  }
}

export function evalExpr(tokenSlice: Token[]): number {
  return new ExprParser([...tokenSlice, { kind: "EOF", value: "", pos: -1 }]).parse();
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function formatParam(value: number): string {
  if (Math.abs(value) < 1e-12) return "0";

  const ratio = value / Math.PI;
  const sign = ratio < 0 ? "-" : "";
  const absRatio = Math.abs(ratio);

  for (let denom = 1; denom <= 64; denom++) {
    const numer = Math.round(absRatio * denom);
    if (Math.abs(numer / denom - absRatio) < 1e-9 * Math.max(1, absRatio)) {
      const g = gcd(numer, denom);
      const p = numer / g;
      const q = denom / g;
      if (p === 1 && q === 1) return `${sign}pi`;
      if (q === 1) return `${sign}${p}*pi`;
      if (p === 1) return `${sign}pi/${q}`;
      return `${sign}${p}*pi/${q}`;
    }
  }

  const text = String(Math.round(value * 1e12) / 1e12);
  return text.includes(".") ? text.replace(/\.?0+$/, "") : text;
}

export function parseParamExpression(expr: string): number {
  const tokens = tokenize(expr);
  return evalExpr(tokens.slice(0, -1));
}

export function formatParamForDisplay(value: number): string {
  return formatParam(value);
}
