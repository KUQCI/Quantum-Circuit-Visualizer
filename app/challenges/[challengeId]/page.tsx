import {
  CHALLENGES,
  CHALLENGE_IDS,
  getChallengeById,
} from "@/lib/learning/challenges";
import {
  getNextChallengeById,
  getPrevChallenge,
  getRelatedLesson,
} from "@/lib/navigation/flow";
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

  const nextChallenge = getNextChallengeById(challengeId);
  const prevChallenge = getPrevChallenge(challengeId);
  const relatedLesson = getRelatedLesson(challengeId);

  return (
    <ChallengePlayerClient
      challenge={challenge}
      nextHref={nextChallenge ? `/challenges/${nextChallenge.id}` : undefined}
      prevHref={prevChallenge ? `/challenges/${prevChallenge.id}` : undefined}
      relatedHref={relatedLesson ? `/learn/${relatedLesson.id}` : undefined}
      relatedLabel={relatedLesson ? `Review ${relatedLesson.title}` : undefined}
    />
  );
}
