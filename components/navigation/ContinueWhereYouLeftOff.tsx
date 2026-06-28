"use client";

import { useEffect } from "react";
import { useCircuitStore } from "@/store/circuit-store";
import { useProgressStore } from "@/store/progress-store";
import { getContinueTargets } from "@/lib/navigation/flow";
import { NextStepCard } from "@/components/navigation/NextStepCard";

interface ContinueWhereYouLeftOffProps {
  className?: string;
  showProject?: boolean;
}

export function ContinueWhereYouLeftOff({
  className,
  showProject = true,
}: ContinueWhereYouLeftOffProps) {
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const completedChallenges = useProgressStore((s) => s.completedChallenges);
  const { projects, currentProjectId, loadProjects } = useCircuitStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const targets = getContinueTargets(
    completedLessons,
    completedChallenges,
    projects,
    currentProjectId
  );

  const cards: {
    badge: string;
    title: string;
    description: string;
    href: string;
    ctaLabel: string;
    secondaryHref?: string;
    secondaryLabel?: string;
  }[] = [];

  if (targets.lesson) {
    cards.push({
      badge: "Continue Learning",
      title: targets.lesson.title,
      description: targets.lesson.description,
      href: `/learn/${targets.lesson.id}`,
      ctaLabel: "Resume Lesson",
      secondaryHref: "/progress",
      secondaryLabel: "View Progress",
    });
  }

  if (showProject && targets.project?.circuit?.qubits && targets.project?.circuit?.operations) {
    cards.push({
      badge: "Continue Building",
      title: targets.project.name,
      description: `${targets.project.circuit.qubits.length} qubits · ${targets.project.circuit.operations.length} gates`,
      href: `/editor?project=${targets.project.id}`,
      ctaLabel: "Open in Build",
      secondaryHref: "/projects",
      secondaryLabel: "All Projects",
    });
  }

  if (cards.length === 0 && targets.challenge) {
    cards.push({
      badge: "Recommended Challenge",
      title: targets.challenge.title,
      description: targets.challenge.description,
      href: `/challenges/${targets.challenge.id}`,
      ctaLabel: "Start Challenge",
      secondaryHref: "/challenges",
      secondaryLabel: "All Challenges",
    });
  }

  if (cards.length === 0) {
    return (
      <NextStepCard
        className={className}
        badge="Get Started"
        title="Start your quantum journey"
        description="Build a circuit from scratch or begin with the first lesson."
        href="/learn/what-is-a-qubit"
        ctaLabel="Start Learning"
        secondaryHref="/editor"
        secondaryLabel="Start Building"
      />
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {cards.map((card) => (
          <NextStepCard
            key={card.href}
            badge={card.badge}
            title={card.title}
            description={card.description}
            href={card.href}
            ctaLabel={card.ctaLabel}
            secondaryHref={card.secondaryHref}
            secondaryLabel={card.secondaryLabel}
          />
        ))}
      </div>
    </div>
  );
}
