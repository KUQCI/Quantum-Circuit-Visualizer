"use client";

import { GATE_CATEGORIES, GATE_LIBRARY_UI, getGateColor } from "./gate-definitions";
import { cn } from "@/lib/utils";

interface GateLibraryProps {
  onDragStart: (gateType: string) => void;
}

export function GateLibrary({ onDragStart }: GateLibraryProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="text-sm font-semibold">Gate Library</h2>
        <p className="text-xs text-[var(--color-muted-foreground)]">Drag gates onto the canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {GATE_CATEGORIES.map((category) => {
          const gates = GATE_LIBRARY_UI.filter((g) => g.category === category.id);
          return (
            <div key={category.id}>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {category.label}
              </h3>
              <div className="grid grid-cols-3 gap-2">
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
                      "flex h-10 cursor-grab items-center justify-center rounded-md border text-xs font-semibold transition-shadow active:cursor-grabbing hover:shadow-md",
                      getGateColor(gate.category)
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
