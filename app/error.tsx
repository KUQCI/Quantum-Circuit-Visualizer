"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page-container flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-[var(--color-muted-foreground)]">
        A client error stopped this page from loading. Try again, or return home.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/editor">Open Build</Link>
        </Button>
      </div>
    </div>
  );
}
