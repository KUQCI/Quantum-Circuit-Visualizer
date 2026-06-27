import {
  CHALLENGES,
  CHALLENGE_IDS,
  getChallengeById,
} from "@/lib/learning/challenges";
import { ChallengePlayerClient } from "./challenge-player-client";

export function generateStaticParams() {
  return CHALLENGE_IDS.map((challengeId) => ({ challengeId }));
}

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const challenge = getChallengeById(challengeId);

  if (!challenge) {
    return (
      <div className="page-container py-12 text-center">
        <p>Challenge not found.</p>
      </div>
    );
  }

  const idx = CHALLENGES.findIndex((c) => c.id === challengeId);
  const next =
    idx >= 0 && idx < CHALLENGES.length - 1 ? CHALLENGES[idx + 1] : null;

  return (
    <ChallengePlayerClient
      challenge={challenge}
      nextHref={next ? `/challenges/${next.id}` : undefined}
    />
  );
}
