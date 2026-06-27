import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantaMessage } from "@/components/mascot/QuantaMessage";

interface LockedActivityStateProps {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}

export function LockedActivityState({
  title,
  description,
  backHref,
  backLabel,
}: LockedActivityStateProps) {
  return (
    <div className="page-container flex min-h-[50vh] max-w-2xl flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]">
        <Lock className="h-6 w-6 text-[var(--color-muted-foreground)]" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{title}</h1>
      <p className="mt-2 max-w-md text-[var(--color-muted-foreground)]">{description}</p>
      <QuantaMessage
        title="Quanta"
        message="Complete the previous steps first — I'll unlock this when you're ready!"
        className="mt-6 w-full max-w-lg text-left"
      />
      <Button asChild className="mt-6">
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}
