import type { GateDefinition } from "./gate-definitions";
import { GatePaletteIcon } from "./gate-palette-icon";
import {
  Gauge,
  Minus,
  ArrowLeftRight,
  Circle,
} from "lucide-react";

export function GateSymbol({
  gate,
  className = "h-3.5 w-3.5",
  variant = "canvas",
}: {
  gate: GateDefinition;
  className?: string;
  /** palette = IBM Composer operations grid; canvas = compact circuit tile */
  variant?: "palette" | "canvas";
}) {
  if (variant === "palette") {
    return <GatePaletteIcon gate={gate} className={className} />;
  }

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
      return (
        <Circle className={className} fill="currentColor" strokeWidth={0} />
      );
    case "reset":
      return (
        <span className="text-[9px] font-bold leading-none">|0⟩</span>
      );
    case "identity":
      return (
        <span className="text-[10px] font-bold leading-none">I</span>
      );
    case "sqrtx":
      return (
        <span className="text-[8px] font-bold leading-none">
          {gate.type === "sxdg" ? "√X†" : "√X"}
        </span>
      );
    case "if":
      return (
        <span className="text-[9px] font-bold leading-none">if</span>
      );
    default:
      if (gate.type === "tdg") {
        return <span className="text-[10px] font-bold leading-none">T†</span>;
      }
      if (gate.type === "sdg") {
        return <span className="text-[10px] font-bold leading-none">S†</span>;
      }
      if (gate.type === "cx") {
        return <span className="text-[14px] font-bold leading-none">⊕</span>;
      }
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
      {gate.defaultParams3 && (
        <div className="text-[10px] text-[var(--color-muted-foreground)]">
          Defaults: θ={gate.defaultParams3[0].display}, φ=
          {gate.defaultParams3[1].display}, λ={gate.defaultParams3[2].display}
        </div>
      )}
    </div>
  );
}
