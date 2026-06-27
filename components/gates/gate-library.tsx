"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GATE_CATEGORIES, GATE_LIBRARY_UI, getGateColor } from "./gate-definitions";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface GateLibraryProps {
  onDragStart: (gateType: string) => void;
}

export function GateLibrary({ onDragStart }: GateLibraryProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return GATE_LIBRARY_UI;
    return GATE_LIBRARY_UI.filter(
      (g) =>
        g.label.toLowerCase().includes(q) ||
        g.type.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--color-border)] px-3 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Operations
        </h2>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search gates..."
            className="h-7 border-[var(--color-border)] bg-[var(--color-surface)] pl-7 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {GATE_CATEGORIES.map((category) => {
          const gates = filtered.filter((g) => g.category === category.id);
          if (gates.length === 0) return null;
          return (
            <div key={category.id} className="mb-3">
              <h3 className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                {category.label}
              </h3>
              <div className="grid grid-cols-4 gap-1">
                {gates.map((gate) => (
                  <div
                    key={gate.type}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("gateType", gate.type);
                      e.dataTransfer.effectAllowed = "copy";
                      onDragStart(gate.type);
                    }}
                    title={gate.description}
                    className={cn(
                      "flex aspect-square cursor-grab flex-col items-center justify-center rounded-sm border text-[11px] font-semibold transition-transform active:cursor-grabbing active:scale-95 hover:brightness-125",
                      getGateColor(gate)
                    )}
                  >
                    {gate.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
