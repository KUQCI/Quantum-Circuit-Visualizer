"use client";

import { useMemo, useState } from "react";
import { Search, LayoutGrid, List } from "lucide-react";
import {
  GATE_CATEGORIES,
  GATE_LIBRARY_UI,
  getGateColor,
} from "./gate-definitions";
import { GateSymbol, GateTooltipContent } from "./gate-symbol";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GateLibraryProps {
  onDragStart: (gateType: string) => void;
  onDragEnd?: () => void;
}

export function GateLibrary({ onDragStart, onDragEnd }: GateLibraryProps) {
  const [query, setQuery] = useState("");
  const [compact, setCompact] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const draggable = GATE_LIBRARY_UI.filter((g) => g.type !== "control");
    if (!q) return draggable;
    return draggable.filter(
      (g) =>
        g.label.toLowerCase().includes(q) ||
        g.type.toLowerCase().includes(q) ||
        g.fullName.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.qiskitExample.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--color-border)] px-3 py-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Operations
            </h2>
            <div className="flex gap-0.5">
              <button
                type="button"
                className={cn(
                  "rounded p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)]",
                  !compact && "bg-[var(--color-secondary)] text-[var(--color-foreground)]"
                )}
                onClick={() => setCompact(false)}
                title="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className={cn(
                  "rounded p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)]",
                  compact && "bg-[var(--color-secondary)] text-[var(--color-foreground)]"
                )}
                onClick={() => setCompact(true)}
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
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
                {compact ? (
                  <div className="space-y-0.5">
                    {gates.map((gate) => (
                      <GateListItem
                        key={gate.type}
                        gate={gate}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1">
                    {gates.map((gate) => (
                      <GateGridItem
                        key={gate.type}
                        gate={gate}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

function GateGridItem({
  gate,
  onDragStart,
  onDragEnd,
}: {
  gate: (typeof GATE_LIBRARY_UI)[0];
  onDragStart: (t: string) => void;
  onDragEnd?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", gate.type);
            e.dataTransfer.setData("gateType", gate.type);
            e.dataTransfer.effectAllowed = "copy";
            onDragStart(gate.type);
          }}
          onDragEnd={() => onDragEnd?.()}
          className={cn(
            "flex aspect-square cursor-grab select-none flex-col items-center justify-center rounded-sm border text-[11px] font-semibold transition-transform active:cursor-grabbing active:scale-95 hover:brightness-125",
            getGateColor(gate)
          )}
        >
          <GateSymbol gate={gate} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <GateTooltipContent gate={gate} />
      </TooltipContent>
    </Tooltip>
  );
}

function GateListItem({
  gate,
  onDragStart,
  onDragEnd,
}: {
  gate: (typeof GATE_LIBRARY_UI)[0];
  onDragStart: (t: string) => void;
  onDragEnd?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", gate.type);
            e.dataTransfer.setData("gateType", gate.type);
            e.dataTransfer.effectAllowed = "copy";
            onDragStart(gate.type);
          }}
          onDragEnd={() => onDragEnd?.()}
          className={cn(
            "flex cursor-grab select-none items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-[var(--color-secondary)] active:cursor-grabbing",
            getGateColor(gate)
          )}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm">
            <GateSymbol gate={gate} className="h-3 w-3" />
          </span>
          <span className="truncate font-medium">{gate.fullName}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <GateTooltipContent gate={gate} />
      </TooltipContent>
    </Tooltip>
  );
}
