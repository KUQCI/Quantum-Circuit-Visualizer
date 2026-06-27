"use client";

import { QuantaMessage } from "@/components/mascot/QuantaMessage";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

interface ChallengeFeedbackProps {
  status: "idle" | "success" | "error";
  message: string;
  quantaMessage?: string;
  xpAwarded?: number;
}

export function ChallengeFeedback({
  status,
  message,
  quantaMessage,
  xpAwarded,
}: ChallengeFeedbackProps) {
  if (status === "idle") return null;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
          status === "success"
            ? "border-[var(--color-success)]/40 bg-[var(--color-success-subtle)] text-[var(--color-success-foreground)]"
            : "border-[var(--color-destructive)]/40 bg-[var(--color-error-subtle)] text-[var(--color-error-foreground)]"
        )}
        role="alert"
      >
        {status === "success" ? (
          <CheckCircle2 className="h-4 w-4 shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 shrink-0" />
        )}
        <span>{message}</span>
        {xpAwarded !== undefined && xpAwarded > 0 && (
          <span className="ml-auto academy-xp-pill text-[10px]">+{xpAwarded} XP</span>
        )}
      </div>
      {quantaMessage && (
        <QuantaMessage
          message={quantaMessage}
          variant={status === "success" ? "success" : "error"}
        />
      )}
    </div>
  );
}
