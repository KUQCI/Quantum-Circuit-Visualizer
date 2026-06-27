import type { GateDefinition } from "./gate-definitions";
import {
  Gauge,
  Minus,
  ArrowLeftRight,
  Circle,
} from "lucide-react";

export function GateSymbol({
  gate,
  className = "h-3.5 w-3.5",
}: {
  gate: GateDefinition;
  className?: string;
}) {
  switch (gate.symbol) {
    case "measure":
      return <Gauge className={className} strokeWidth={2} />;
    case "barrier":
      return (
        <span className="flex h-full w-full flex-col items-center justify-center gap-0.5">
          <Minus className={className} strokeWidth={3} />
          <Minus className={className} strokeWidth={3} />
        </span>
      );
    case "swap":
      return <ArrowLeftRight className={className} strokeWidth={2} />;
    case "control":
      return <Circle className={className} fill="currentColor" strokeWidth={0} />;
    default:
      return (
        <span className="text-[11px] font-bold leading-none">{gate.label}</span>
      );
  }
}

export function GateTooltipContent({ gate }: { gate: GateDefinition }) {
  return (
    <div className="space-y-1">
      <div className="font-semibold text-[var(--color-foreground)]">
        {gate.fullName}
      </div>
      <div className="font-mono text-[10px] text-[var(--color-accent-foreground)]">
        {gate.qiskitExample}
      </div>
      <div className="text-[10px] leading-snug text-[var(--color-muted-foreground)]">
        {gate.description}
      </div>
      {gate.defaultParams && (
        <div className="text-[10px] text-[var(--color-muted-foreground)]">
          Default: θ = {gate.defaultParams.display}
        </div>
      )}
    </div>
  );
}
