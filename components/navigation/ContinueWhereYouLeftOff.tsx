"use client";

import { useEffect } from "react";
import { useCircuitStore } from "@/store/circuit-store";
import { useProgressStore } from "@/store/progress-store";
import { getContinueTargets } from "@/lib/navigation/flow";
import { NextStepCard } from "@/components/navigation/NextStepCard";
import { ProgressHydrationGate } from "@/components/layout/progress-hydration-gate";
import { pluralize } from "@/lib/utils";

interface ContinueWhereYouLeftOffProps {
  className?: string;
  showProject?: boolean;
  showLesson?: boolean;
  showChallenge?: boolean;
  excludeChallengeId?: string;
}

export function ContinueWhereYouLeftOff({
  className,
  showProject = true,
  showLesson = true,
  showChallenge = true,
  excludeChallengeId,
}: ContinueWhereYouLeftOffProps) {
  return (
    <div className={className}>
      <ProgressHydrationGate>
        <ContinueWhereYouLeftOffContent
          showProject={showProject}
          showLesson={showLesson}
          showChallenge={showChallenge}
          excludeChallengeId={excludeChallengeId}
        />
      </ProgressHydrationGate>
    </div>
  );
}

function ContinueWhereYouLeftOffContent({
  showProject = true,
  showLesson = true,
  showChallenge = true,
  excludeChallengeId,
}: Pick<
  ContinueWhereYouLeftOffProps,
  "showProject" | "showLesson" | "showChallenge"
  | "excludeChallengeId"
>) {
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

  if (showLesson && targets.lesson) {
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
      description: `${pluralize(targets.project.circuit.qubits.length, "qubit")} · ${pluralize(targets.project.circuit.operations.length, "gate")}`,
      href: `/editor?project=${targets.project.id}`,
      ctaLabel: "Open in Build",
      secondaryHref: "/projects",
      secondaryLabel: "All Projects",
    });
  }

  if (
    showChallenge &&
    cards.length === 0 &&
    targets.challenge &&
    targets.challenge.id !== excludeChallengeId
  ) {
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

  if (!showProject && !showLesson && !showChallenge && cards.length === 0) {
    return null;
  }

  if (
    excludeChallengeId &&
    targets.challenge?.id === excludeChallengeId &&
    cards.length === 0
  ) {
    return null;
  }

  if (cards.length === 0) {
    return (
      <NextStepCard
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
  );
}
