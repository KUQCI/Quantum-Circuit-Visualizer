"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEYS = [
  "qiskit-visualizer-circuit",
  "qiskit-visualizer-progress",
  "qiskit-visualizer-theme",
  "qiskit-visualizer-editor-ui",
  "qiskit-visualizer-execution",
  "qiskit-visualizer-projects",
];

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const clearSavedData = () => {
    for (const key of STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    reset();
  };

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#050914] p-6 text-[#e2e8f0]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-3 text-sm text-[#94a3b8]">
            The app hit a client-side error. This is often caused by saved
            browser data from an older version.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => reset()}>Try again</Button>
            <Button variant="outline" onClick={clearSavedData}>
              Clear saved data
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
