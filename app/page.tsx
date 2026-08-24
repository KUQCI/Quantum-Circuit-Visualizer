"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ContinueWhereYouLeftOff } from "@/components/navigation/ContinueWhereYouLeftOff";
import {
  ExternalAnchor,
  QCI_HOME_URL,
  QCI_VISUALIZER_REPO,
} from "@/components/navigation/ExternalAnchor";
import { PageActions } from "@/components/navigation/PageActions";
import { ArtistAssetPlaceholder } from "@/components/assets/ArtistAssetPlaceholder";
import { useCircuitStore } from "@/store/circuit-store";
import { formatDate } from "@/lib/utils";
import {
  PenLine,
  Upload,
  GraduationCap,
  ExternalLink,
  FolderOpen,
  ArrowLeftRight,
  BookOpen,
} from "lucide-react";

const missionCards = [
  {
    n: "01",
    title: "Learn",
    href: "/learn",
    body: "Beginner-friendly lessons guided by Quanta.",
  },
  {
    n: "02",
    title: "Build",
    href: "/editor",
    body: "Create circuits visually and export real code.",
  },
  {
    n: "03",
    title: "Connect",
    href: "/export",
    body: "Bridge visual learning with Qiskit, OpenQASM, and Cirq.",
  },
] as const;

export default function HomePage() {
  const { projects, loadProjects } = useCircuitStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const recentProjects = projects.slice(0, 4);

  return (
    <div className="page-container max-w-5xl pb-4">
      {/* Hero */}
      <section className="relative mb-4 overflow-hidden rounded-2xl border border-[var(--color-border)]">
        <ArtistAssetPlaceholder
          assetId="quantum-journey-banner"
          aspect="banner"
          className="rounded-none border-0 border-b border-dashed border-[var(--color-brand-border)]"
        />
        <div className="relative px-5 py-10 text-center sm:px-10 sm:py-14">
          <div
            className="pointer-events-none absolute inset-0 -z-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(47,128,237,0.18), transparent 60%)",
            }}
            aria-hidden
          />
          <ExternalAnchor
            href={QCI_HOME_URL}
            className="relative z-[1] mb-5 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-brand)]"
          >
            <Image
              src="https://kuqci.github.io/logo.png"
              alt=""
              width={20}
              height={20}
              className="rounded-full"
              unoptimized
              aria-hidden
            />
            <span className="mono-label text-[0.7rem] tracking-[0.12em] text-[var(--color-brand)]">
              Khalifa University Quantum Computing Initiative
            </span>
            <ExternalLink className="h-3 w-3" />
          </ExternalAnchor>

          <h1 className="relative z-[1] text-4xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            Quantum Circuit Visualizer
          </h1>
          <p className="relative z-[1] mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-muted-foreground)]">
            From bits to qubits — build, view, and convert quantum circuits
            through an interactive visual editor.
          </p>
          <PageActions
            className="relative z-[1] mt-8 justify-center"
            primary={[
              {
                label: "Start Building",
                href: "/editor",
                icon: <PenLine className="h-4 w-4" />,
              },
              {
                label: "Start Learning",
                href: "/learn",
                icon: <GraduationCap className="h-4 w-4" />,
              },
            ]}
            secondary={[
              {
                label: "Open Projects",
                href: "/projects",
                icon: <FolderOpen className="h-4 w-4" />,
              },
              {
                label: "Import Qiskit",
                href: "/import",
                icon: <Upload className="h-4 w-4" />,
              },
            ]}
          />
          <p className="relative z-[1] mx-auto mt-6 max-w-lg text-sm text-[var(--color-muted-foreground)]">
            An open-source QCI R&amp;D project for learning and prototyping
            quantum circuits.
          </p>
        </div>
      </section>

      {/* Intro media + Quanta placeholders */}
      <section className="mb-2 grid gap-4 md:grid-cols-2">
        <ArtistAssetPlaceholder assetId="intro-video" aspect="video" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          <ArtistAssetPlaceholder assetId="quanta-teacher" aspect="square" />
          <ArtistAssetPlaceholder
            assetId="bloch-sphere-duck-icon"
            aspect="square"
          />
        </div>
      </section>

      {/* Mission */}
      <section className="qci-section">
        <p className="qci-section-eyebrow">Mission</p>
        <h2 className="qci-section-title">
          Making quantum circuits easier to learn, build, and share.
        </h2>
        <p className="qci-section-lead">
          QCI exists to make quantum computing accessible, practical, and
          collaborative — this visualizer is one R&amp;D tool on that path.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {missionCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="technical-panel group block p-6 transition duration-200 hover:shadow-[var(--shadow-blue-glow)]"
            >
              <p className="mono-label mb-6 text-xs text-[var(--color-brand)]/70">
                {card.n}
              </p>
              <h3 className="text-xl font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-brand)]">
                {card.title}
              </h3>
              <p className="mt-3 leading-7 text-[var(--color-muted-foreground)]">
                {card.body}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* R&D Project */}
      <section className="qci-section border-t border-[var(--color-border)]">
        <p className="qci-section-eyebrow">R&amp;D Project</p>
        <h2 className="qci-section-title">Part of the QCI open-source stack</h2>
        <article className="technical-panel mt-8 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <ExternalAnchor
              href={QCI_VISUALIZER_REPO}
              className="mono-label break-all text-xs text-[var(--color-brand)] sm:text-sm"
            >
              KUQCI/Quantum-Circuit-Visualizer
            </ExternalAnchor>
            <span className="status-pill status-pill--prototyping">
              Prototyping
            </span>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="mono-label text-[0.65rem] text-[var(--color-muted-foreground)]">
                Focus
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)]">
                Visual quantum circuit education and code conversion
              </dd>
            </div>
            <div>
              <dt className="mono-label text-[0.65rem] text-[var(--color-muted-foreground)]">
                Deployment
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)]">
                GitHub Pages · /Quantum-Circuit-Visualizer/
              </dd>
            </div>
            <div>
              <dt className="mono-label text-[0.65rem] text-[var(--color-muted-foreground)]">
                Status
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)]">
                Prototyping — interactive Build, Learn, and Challenges
              </dd>
            </div>
            <div>
              <dt className="mono-label text-[0.65rem] text-[var(--color-muted-foreground)]">
                Ecosystem
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)]">
                <ExternalAnchor
                  href={QCI_HOME_URL}
                  className="text-[var(--color-brand)] hover:underline"
                >
                  qcinit.tech
                </ExternalAnchor>
              </dd>
            </div>
          </dl>
          <div className="qci-divider mt-6" />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild size="sm" variant="outline">
              <Link href="/docs/assets">
                <BookOpen className="h-3.5 w-3.5" />
                Artist asset tracker
              </Link>
            </Button>
            <ExternalAnchor
              href={QCI_VISUALIZER_REPO}
              className="inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-brand)]"
            >
              View on GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </ExternalAnchor>
          </div>
        </article>
      </section>

      {/* Continue */}
      <section className="qci-section border-t border-[var(--color-border)]">
        <p className="qci-section-eyebrow">Continue</p>
        <h2 className="qci-section-title">Pick up where you left off</h2>
        <p className="qci-section-lead">
          Resume learning, return to Build, or open a recent project saved in
          this browser.
        </p>
        <div className="mt-8">
          <ContinueWhereYouLeftOff />
        </div>
      </section>

      {/* Recent projects */}
      <section className="qci-section border-t border-[var(--color-border)] pt-10">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="qci-section-eyebrow mb-2">Projects</p>
            <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
              Recent Projects
            </h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/projects">View all</Link>
          </Button>
        </div>
        {recentProjects.length === 0 ? (
          <div className="technical-panel px-6 py-10 text-center text-[var(--color-muted-foreground)]">
            No saved projects yet. Create a circuit in the editor or import code
            to get started.
            <div className="mt-4 flex justify-center gap-2">
              <Button asChild size="sm">
                <Link href="/editor">Start Building</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/import">Import Code</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentProjects.map((project) => (
              <article
                key={project.id}
                className="technical-panel p-5 transition hover:border-[var(--color-border-strong)]"
              >
                <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                  {project.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  {project.circuit.qubits.length} qubits ·{" "}
                  {project.circuit.operations.length} gates ·{" "}
                  {formatDate(project.updatedAt)}
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href={`/editor?project=${project.id}`}>
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    Open in Build
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ArtistAssetPlaceholder
          assetId="custom-gate-icon"
          aspect="icon"
          className="mx-auto w-full"
        />
        <ArtistAssetPlaceholder
          assetId="bloch-sphere-duck-icon"
          aspect="icon"
          className="mx-auto w-full"
        />
        <ArtistAssetPlaceholder
          assetId="quanta-wave-loop"
          aspect="icon"
          className="mx-auto w-full"
        />
        <ArtistAssetPlaceholder
          assetId="gate-opening-animation"
          aspect="icon"
          className="mx-auto w-full"
        />
      </div>
    </div>
  );
}
