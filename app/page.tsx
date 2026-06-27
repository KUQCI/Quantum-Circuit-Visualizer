"use client";

import Link from "next/link";
import Image from "next/image";
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
  ExternalLink,
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
        <Link
          href="https://kuqci.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-cyan-quantum)]"
        >
          <Image
            src="https://kuqci.github.io/logo.png"
            alt="KUQCI"
            width={20}
            height={20}
            className="rounded"
            unoptimized
          />
          Khalifa University Quantum Computing Initiative
          <ExternalLink className="h-3 w-3" />
        </Link>

        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
          Quantum Circuit{" "}
          <span className="text-[var(--color-cyan-quantum)]">Visualizer</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--color-muted-foreground)]">
          From bits to qubits — build, view, and convert quantum circuits with
          visual editing and multi-language code export.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/editor">
              <PenLine className="h-4 w-4" />
              Start New Circuit
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/import">
              <Upload className="h-4 w-4" />
              Import Code
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
              <ArrowLeftRight className="h-4 w-4 text-[var(--color-cyan-quantum)]" />
              Multi-Language Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Bidirectional conversion between visual circuits and Qiskit,
              OpenQASM, and Cirq code.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-[var(--color-gold-duck)]" />
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
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          Recent Projects
        </h2>
        {recentProjects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-[var(--color-muted-foreground)]">
              No saved projects yet. Create a circuit in the editor or import
              code to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentProjects.map((project) => (
              <Card
                key={project.id}
                className="transition-all hover:border-[rgba(125,211,252,0.3)]"
              >
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
                    <Link
                      href="/editor"
                      onClick={() =>
                        useCircuitStore.getState().openProject(project.id)
                      }
                    >
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
