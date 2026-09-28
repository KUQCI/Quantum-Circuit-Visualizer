"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { circuitSymbols } from "@/lib/parameter-bindings";
import { formatParam, parseParamExpression } from "@/lib/translator-core";
import { cn } from "@/lib/utils";
import { useCircuitStore } from "@/store/circuit-store";

export function ParameterBindingsPanel() {
  const circuit = useCircuitStore((state) => state.circuit);
  const setParameterBinding = useCircuitStore(
    (state) => state.setParameterBinding
  );
  const clearParameterBinding = useCircuitStore(
    (state) => state.clearParameterBinding
  );
  const symbols = useMemo(() => circuitSymbols(circuit), [circuit]);
  const bindings = circuit.parameterBindings;
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setDrafts((current) => {
      const next: Record<string, string> = {};
      for (const symbol of symbols) {
        const binding = bindings?.[symbol];
        next[symbol] =
          typeof binding === "number" && Number.isFinite(binding)
            ? formatParam(binding)
            : current[symbol] ?? "";
      }
      return next;
    });
  }, [bindings, symbols]);

  if (symbols.length === 0) return null;

  const commit = (symbol: string) => {
    const text = drafts[symbol]?.trim() ?? "";
    const previous = bindings?.[symbol];
    try {
      const value = parseParamExpression(text);
      if (!Number.isFinite(value)) throw new Error("Invalid parameter");
      setParameterBinding(symbol, value);
      setDrafts((current) => ({ ...current, [symbol]: formatParam(value) }));
    } catch {
      setDrafts((current) => ({
        ...current,
        [symbol]:
          typeof previous === "number" && Number.isFinite(previous)
            ? formatParam(previous)
            : "",
      }));
    }
  };

  const unbound = symbols.some((symbol) => {
    const value = bindings?.[symbol];
    return !(typeof value === "number" && Number.isFinite(value));
  });

  return (
    <section className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        Parameters
      </p>
      <div className="space-y-2">
        {symbols.map((symbol) => {
          const value = bindings?.[symbol];
          const bound = typeof value === "number" && Number.isFinite(value);
          return (
            <div key={symbol} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="min-w-10 font-mono text-xs text-[var(--color-foreground)]">
                  {symbol}
                </span>
                <input
                  type="range"
                  min="0"
                  max={2 * Math.PI}
                  step="0.01"
                  value={bound ? value : 0}
                  aria-label={`Value of ${symbol}`}
                  onChange={(event) =>
                    setParameterBinding(symbol, Number(event.target.value))
                  }
                  className={cn(
                    "h-1.5 min-w-0 flex-1 accent-[var(--color-brand)]",
                    !bound && "opacity-50"
                  )}
                />
                <span className="w-10 text-right font-mono text-[10px] text-[var(--color-muted-foreground)]">
                  {bound ? formatParam(value) : "—"}
                </span>
                {bound && (
                  <button
                    type="button"
                    className="rounded p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-background)] hover:text-[var(--color-foreground)]"
                    aria-label={`Unbind ${symbol}`}
                    title={`Unbind ${symbol}`}
                    onClick={() => {
                      clearParameterBinding(symbol);
                      setDrafts((current) => ({ ...current, [symbol]: "" }));
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={drafts[symbol] ?? ""}
                placeholder="unbound"
                aria-label={`Value of ${symbol}`}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [symbol]: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                onBlur={() => commit(symbol)}
                className="h-7 w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 font-mono text-[11px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
              />
            </div>
          );
        })}
      </div>
      {unbound && (
        <p className="text-[10px] text-[var(--color-muted-foreground)]">
          Unbound parameters pause simulation.
        </p>
      )}
    </section>
  );
}
