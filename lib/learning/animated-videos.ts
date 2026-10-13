import animatedStoryboardsJson from "./animated-storyboards.json";

type AnimatedStoryboardData = {
  lessons: Array<{
    id: string;
    beats: Array<{ speech: string }>;
  }>;
};

const animatedStoryboards =
  animatedStoryboardsJson as unknown as AnimatedStoryboardData;

export function animatedVideoTranscript(lessonId: string): string[] | null {
  const lesson = animatedStoryboards.lessons.find(
    (storyboard) => storyboard.id === lessonId
  );

  return lesson ? lesson.beats.map((beat) => beat.speech) : null;
}
