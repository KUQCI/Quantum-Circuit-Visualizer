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
import { QuantaCard } from "@/components/mascot/QuantaCard";
import { QuantaEmptyState } from "@/components/mascot/QuantaEmptyState";
import { Reveal } from "@/components/motion/Reveal";
import { quantaMessages } from "@/lib/mascot/messages";
import { useCircuitStore } from "@/store/circuit-store";
import { formatDate } from "@/lib/utils";
import {
  PenLine,
  Upload,
  GraduationCap,
  ExternalLink,
  FolderOpen,
  ArrowLeftRight,
} from "lucide-react";

const missionCards = [
  {
    n: "01",
    title: "Learn",
    href: "/learn",
    body: "Guided lessons with Quanta — from qubits to entanglement.",
  },
  {
    n: "02",
    title: "Build",
    href: "/editor",
    body: "Compose circuits visually and sync with real Qiskit code.",
  },
  {
    n: "03",
    title: "Connect",
    href: "/export",
    body: "Export to Qiskit, OpenQASM, and Cirq for research workflows.",
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
      <Reveal variant="fade" className="mb-8">
        <section className="relative overflow-hidden rounded-2xl border border-[var(--color-border)]">
          <ArtistAssetPlaceholder
            assetId="quantum-journey-banner"
            aspect="banner"
            variant="polished"
            className="absolute inset-0 min-h-0 rounded-none border-0 aspect-auto h-full w-full"
          />
          <div className="relative px-5 py-12 text-center sm:px-10 sm:py-16">
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

            <p className="relative z-[1] mono-label mb-3 text-[0.7rem] text-[var(--color-muted-foreground)]">
              A QCI R&amp;D Project
            </p>
            <h1 className="relative z-[1] text-4xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
              Quantum Circuit Visualizer
            </h1>
            <p className="relative z-[1] mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-muted-foreground)] sm:text-lg">
              Build, view, and convert quantum circuits through an interactive
              visual editor — bridging learning and real code.
            </p>
          </div>
        </section>
      </Reveal>

      {/* Main CTAs */}
      <Reveal variant="up" delay={80} className="mb-2" as="section">
        <div aria-label="Primary actions">
          <PageActions
            className="justify-center"
            primary={[
              {
                label: "Start Building",
                href: "/editor",
                icon: <PenLine className="h-4 w-4" />,
              },
            ]}
            secondary={[
              {
                label: "Start Learning",
                href: "/learn",
                icon: <GraduationCap className="h-4 w-4" />,
              },
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
        </div>
      </Reveal>

      {/* Meet Quanta — supporting card, not hero */}
      <Reveal variant="up" delay={100} className="mb-8">
        <QuantaCard
          variant="welcome"
          title="Meet Quanta"
          description={quantaMessages.meetQuanta}
          ctaLabel="Start Learning"
          ctaHref="/learn"
          imageSize="md"
        />
      </Reveal>

      {/* Continue */}
      <Reveal as="section" className="qci-section border-t border-[var(--color-border)]">
        <p className="qci-section-eyebrow">Continue</p>
        <h2 className="qci-section-title">Pick up where you left off</h2>
        <p className="qci-section-lead">
          Resume learning, return to Build, or open a recent project saved in
          this browser.
        </p>
        <div className="mt-8">
          <ContinueWhereYouLeftOff />
        </div>
      </Reveal>

      {/* Learn / Build / Connect */}
      <Reveal as="section" className="qci-section border-t border-[var(--color-border)]">
        <p className="qci-section-eyebrow">Mission</p>
        <h2 className="qci-section-title">
          Learn, build, and connect quantum circuits
        </h2>
        <p className="qci-section-lead">
          One product for education and prototyping — aligned with QCI&apos;s
          mission to make quantum computing accessible and practical.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {missionCards.map((card, i) => (
            <Reveal key={card.title} delay={i * 90} variant="up">
              <Link
                href={card.href}
                className="technical-panel group block h-full p-6"
              >
                <p className="mono-label mb-6 text-xs text-[var(--color-brand)]/70">
                  {card.n}
                </p>
                <h3 className="text-xl font-semibold text-[var(--color-foreground)] transition-colors group-hover:text-[var(--color-brand)]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted-foreground)]">
                  {card.body}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </Reveal>

      {/* R&D Project */}
      <Reveal as="section" className="qci-section border-t border-[var(--color-border)]">
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
            <span className="status-pill status-pill--prototyping motion-status-pulse">
              Prototyping
            </span>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="mono-label text-[0.7rem] text-[var(--color-muted-foreground)]">
                Focus
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)]">
                Visual quantum circuit education and code conversion
              </dd>
            </div>
            <div>
              <dt className="mono-label text-[0.7rem] text-[var(--color-muted-foreground)]">
                Deployment
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)]">
                GitHub Pages · /Quantum-Circuit-Visualizer/
              </dd>
            </div>
            <div>
              <dt className="mono-label text-[0.7rem] text-[var(--color-muted-foreground)]">
                Status
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)]">
                Interactive Build, Learn, Challenges, and Projects
              </dd>
            </div>
            <div>
              <dt className="mono-label text-[0.7rem] text-[var(--color-muted-foreground)]">
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
          <div className="mt-4">
            <ExternalAnchor
              href={QCI_VISUALIZER_REPO}
              className="inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-brand)]"
            >
              View on GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </ExternalAnchor>
          </div>
        </article>
      </Reveal>

      {/* Recent projects */}
      <Reveal as="section" className="qci-section border-t border-[var(--color-border)] pt-10">
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
          <QuantaEmptyState
            variant="empty"
            title="No saved circuits yet"
            description="Open a template on Projects, or start building from a blank canvas."
            actions={[
              { label: "Browse templates", href: "/projects", primary: true },
              { label: "Start blank circuit", href: "/editor" },
            ]}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentProjects.map((project, i) => (
              <Reveal key={project.id} delay={i * 70}>
                <article className="technical-panel h-full p-5">
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
              </Reveal>
            ))}
          </div>
        )}
      </Reveal>
    </div>
  );
}
