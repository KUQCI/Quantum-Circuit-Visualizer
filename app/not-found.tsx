import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-container flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold text-[var(--color-foreground)]">404</h1>
      <p className="mt-3 max-w-md text-[var(--color-muted-foreground)]">
        This page does not exist. Return home or open Build mode to continue
        working on circuits.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/editor">Open Build</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/learn">Learn</Link>
        </Button>
      </div>
    </div>
  );
}
