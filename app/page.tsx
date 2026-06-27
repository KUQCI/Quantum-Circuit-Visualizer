"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCircuitStore } from "@/store/circuit-store";
import { formatDate } from "@/lib/utils";
import {
  PenLine,
  Upload,
  CheckCircle2,
  ArrowLeftRight,
  Clock,
} from "lucide-react";

export default function HomePage() {
  const { projects, loadProjects } = useCircuitStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const recentProjects = projects.slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-foreground)]">
          Qiskit Visualizer
        </h1>
        <p className="mt-3 text-lg text-[var(--color-muted-foreground)]">
          Build, view, and convert quantum circuits
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/editor">
              <PenLine className="h-4 w-4" />
              Start New Circuit
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/import">
              <Upload className="h-4 w-4" />
              Import Qiskit Code
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
              JSON Sync Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Unified circuit JSON schema serves as the single source of truth
              for all conversions.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowLeftRight className="h-4 w-4 text-indigo-600" />
              Qiskit Import/Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Bidirectional conversion between visual circuits and Qiskit Python
              code.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-600" />
              Execution Coming Later
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Circuit execution and result visualization are planned for a
              future release.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Projects</h2>
        {recentProjects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-[var(--color-muted-foreground)]">
              No saved projects yet. Create a circuit in the editor or import
              Qiskit code to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentProjects.map((project) => (
              <Card key={project.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  <CardDescription>
                    {project.circuit.qubits.length} qubits ·{" "}
                    {project.circuit.operations.length} gates ·{" "}
                    {formatDate(project.updatedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/editor" onClick={() => useCircuitStore.getState().openProject(project.id)}>
                      Open in Editor
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
