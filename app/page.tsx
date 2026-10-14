"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ContinueWhereYouLeftOff } from "@/components/navigation/ContinueWhereYouLeftOff";
import {
  ExternalAnchor,
  QCI_HOME_URL,
  QCI_VISUALIZER_REPO,
} from "@/components/navigation/ExternalAnchor";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { QuantaEntrance } from "@/components/mascot/QuantaEntrance";
import { Reveal } from "@/components/motion/Reveal";
import { LESSONS } from "@/lib/learning/lessons";
import { MODULE_LABELS, MODULE_ORDER } from "@/lib/learning/progress";
import { getLandingLessonCta } from "@/lib/navigation/flow";
import { usePersistHydrated } from "@/lib/use-persist-hydrated";
import { useProgressStore } from "@/store/progress-store";
import { pluralize } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Code2,
  ExternalLink,
  GraduationCap,
  MousePointerClick,
  PenLine,
  PlayCircle,
  Swords,
  Trophy,
  Upload,
} from "lucide-react";

const learnSteps = [
  {
    icon: PlayCircle,
    title: "Watch",
    body: "Every lesson opens with a short narrated walkthrough, so you see the idea before you touch anything.",
  },
  {
    icon: MousePointerClick,
    title: "Try it yourself",
    body: "Drag gates onto a live circuit and watch the probabilities and the qubit's state change as you go.",
  },
  {
    icon: Trophy,
    title: "Level up",
    body: "Earn XP, keep a daily streak, collect badges and watch Quanta grow up alongside you.",
  },
] as const;

const promises = [
  "Free and open source",
  "No account needed",
  "Works offline",
  "No physics degree required",
] as const;

const moduleLessonCounts = LESSONS.reduce<Record<string, number>>(
  (counts, lesson) => {
    counts[lesson.module] = (counts[lesson.module] ?? 0) + 1;
    return counts;
  },
  {}
);

const moduleLessonIds = LESSONS.reduce<Record<string, string[]>>(
  (ids, lesson) => {
    (ids[lesson.module] ??= []).push(lesson.id);
    return ids;
  },
  {}
);

const builderLinks: { label: string; href: string; icon: ReactNode; body: string }[] = [
  {
    label: "Open the builder",
    href: "/editor",
    icon: <PenLine className="h-4 w-4" />,
    body: "A blank canvas with live simulation.",
  },
  {
    label: "Challenges",
    href: "/challenges",
    icon: <Swords className="h-4 w-4" />,
    body: "Test yourself with circuit puzzles.",
  },
  {
    label: "Import Qiskit",
    href: "/import",
    icon: <Upload className="h-4 w-4" />,
    body: "Paste code and see it as a circuit.",
  },
  {
    label: "Export code",
    href: "/export",
    icon: <Code2 className="h-4 w-4" />,
    body: "Qiskit, OpenQASM, Cirq and PennyLane.",
  },
];

export default function HomePage() {
  const progressHydrated = usePersistHydrated(useProgressStore.persist);
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const learnerLessons = progressHydrated ? completedLessons : [];
  const cta = getLandingLessonCta(learnerLessons);
  const firstModule = MODULE_ORDER[0];

  return (
    <div className="page-container max-w-5xl pb-4">
      <QuantaEntrance />

      {/* Hero */}
      <Reveal variant="fade" className="mb-10">
        <section className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[radial-gradient(ellipse_at_top_left,color-mix(in_srgb,var(--color-brand)_16%,transparent),transparent_60%),radial-gradient(ellipse_at_bottom_right,color-mix(in_srgb,var(--color-primary)_12%,transparent),transparent_55%)]">
          <div className="relative grid items-center gap-8 px-5 py-10 sm:px-10 sm:py-14 md:grid-cols-[1fr_auto]">
            <div className="text-center md:text-left">
              <ExternalAnchor
                href={QCI_HOME_URL}
                className="mb-5 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-brand)]"
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
                  Quantum Circuit Visualizer<span className="hidden sm:inline"> · KU QCI</span>
                </span>
                <ExternalLink className="h-3 w-3" aria-hidden />
              </ExternalAnchor>

              <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-[var(--color-foreground)] sm:text-5xl">
                Learn quantum computing,{" "}
                <span className="text-[var(--color-brand)]">one gate at a time.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)] sm:text-lg md:mx-0">
                Start from zero. Quanta guides you through{" "}
                {pluralize(LESSONS.length, "bite-sized lesson")}: watch the idea,
                build the circuit yourself and see the quantum state change live.
              </p>

              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
                <Button asChild size="lg" className="h-12 gap-2 px-6 text-base">
                  <Link href={cta.href}>
                    <GraduationCap className="h-5 w-5" aria-hidden />
                    {cta.label}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-5">
                  <Link href="/learn">See all lessons</Link>
                </Button>
              </div>
              <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
                {cta.detail}
              </p>

              <ul className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-[var(--color-muted-foreground)] md:justify-start">
                {promises.map((promise) => (
                  <li key={promise} className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-[var(--color-brand)]" aria-hidden />
                    {promise}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mx-auto flex w-full max-w-[16rem] flex-col items-center">
              <div className="relative mb-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-center text-sm leading-relaxed text-[var(--color-foreground)] shadow-sm">
                {cta.returning
                  ? "Welcome back! Ready for the next one?"
                  : "Hi, I'm Quanta! Everyone starts with one qubit. Your first circuit takes about 3 minutes."}
                <span
                  aria-hidden
                  className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-[var(--color-border)] bg-[var(--color-surface)]"
                />
              </div>
              <QuantaImage variant="welcome" size="xl" />
            </div>
          </div>
        </section>
      </Reveal>

      {/* Returning learners */}
      {progressHydrated && cta.returning && (
        <Reveal as="section" className="mb-4">
          <h2 className="sr-only">Pick up where you left off</h2>
          <ContinueWhereYouLeftOff />
        </Reveal>
      )}

      {/* How you'll learn */}
      <Reveal as="section" className="qci-section border-t border-[var(--color-border)]">
        <p className="qci-section-eyebrow">How it works</p>
        <h2 className="qci-section-title">Learning that feels like playing</h2>
        <p className="qci-section-lead">
          No walls of equations. Each lesson is a few minutes long and ends with
          you building something that works.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {learnSteps.map((step, i) => (
            <Reveal key={step.title} delay={i * 90} variant="up">
              <article className="technical-panel h-full p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-[var(--color-brand)]">
                  <step.icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mono-label mt-5 text-xs text-[var(--color-muted-foreground)]">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted-foreground)]">
                  {step.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Reveal>

      {/* Path */}
      <Reveal as="section" className="qci-section border-t border-[var(--color-border)]">
        <p className="qci-section-eyebrow">Your path</p>
        <h2 className="qci-section-title">From your first qubit to quantum machine learning</h2>
        <p className="qci-section-lead">
          {MODULE_ORDER.length} modules, {LESSONS.length} lessons. Go at your own
          pace; your progress stays saved in this browser.
        </p>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULE_ORDER.map((moduleId, i) => {
            const ids = moduleLessonIds[moduleId] ?? [];
            const done =
              ids.length > 0 && ids.every((id) => learnerLessons.includes(id));
            const isStart = moduleId === firstModule && !cta.returning;
            return (
              <li key={moduleId}>
                <Link
                  href="/learn"
                  className={`technical-panel flex h-full items-center gap-4 p-4 ${
                    isStart ? "border-[var(--color-primary)]" : ""
                  }`}
                >
                  <span
                    className={`mono-label flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      done
                        ? "bg-[var(--color-brand)] text-[var(--color-background)]"
                        : "bg-[var(--color-accent)] text-[var(--color-brand)]"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" aria-label="Completed" /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-[var(--color-foreground)]">
                      {MODULE_LABELS[moduleId]}
                    </span>
                    <span className="block text-xs text-[var(--color-muted-foreground)]">
                      {isStart
                        ? "Start here"
                        : pluralize(moduleLessonCounts[moduleId] ?? 0, "lesson")}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </Reveal>

      {/* Encouragement */}
      <Reveal as="section" className="qci-section border-t border-[var(--color-border)]">
        <div className="technical-panel flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
          <QuantaImage variant="thinking" size="lg" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
              Stuck? You&apos;re not on your own.
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted-foreground)] sm:text-base">
              Quanta is there in every lesson with hints when you need them,
              and on bigger screens she follows you around the site. Ask her
              about the circuit you&apos;re building. Mistakes are part of
              learning, and nothing you try here can break.
            </p>
            <Button asChild size="lg" className="mt-5 gap-2">
              <Link href={cta.href}>
                {cta.returning ? cta.label : "Start lesson 1"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>

      {/* Builder */}
      <Reveal as="section" className="qci-section border-t border-[var(--color-border)]">
        <p className="qci-section-eyebrow">Already know the basics?</p>
        <h2 className="qci-section-title">Jump straight into building</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {builderLinks.map((link) => (
            <Link key={link.href} href={link.href} className="technical-panel group block p-4">
              <span className="inline-flex items-center gap-2 font-medium text-[var(--color-foreground)] transition-colors group-hover:text-[var(--color-brand)]">
                {link.icon}
                {link.label}
              </span>
              <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">
                {link.body}
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-sm text-[var(--color-muted-foreground)]">
          An open-source R&amp;D project of the Khalifa University Quantum
          Computing Initiative.{" "}
          <ExternalAnchor
            href={QCI_VISUALIZER_REPO}
            className="inline-flex items-center gap-1 text-[var(--color-brand)] hover:underline"
          >
            View on GitHub
            <ExternalLink className="h-3 w-3" aria-hidden />
          </ExternalAnchor>
        </p>
      </Reveal>
    </div>
  );
}
