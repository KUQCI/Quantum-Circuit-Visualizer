import { normalizePath } from "@/lib/routes";
import { getLevelTitle } from "@/lib/learning/progress";

export function levelUpLine(level: number, unlockedNames: string[]): string {
  const base = `Level ${level} — ${getLevelTitle(level)}! I grew up a little.`;
  return unlockedNames.length > 0
    ? `${base} New in my wardrobe: ${unlockedNames.join(", ")}. Hover over me → Wardrobe.`
    : base;
}

export interface PersonaContext {
  path: string;
  level: number;
  levelTitle: string;
  streak: number;
  completedLessons: number;
  xpToNext: number;
  firstVisit: boolean;
}

const tips: Record<string, string[]> = {
  "/": [
    "Build a small circuit first, then open Learn when you want a guided path.",
    "You can share a circuit from Build when you are ready to show your work.",
    "Press ? anywhere to see the keyboard shortcuts.",
  ],
  "/editor": [
    "Ctrl+Z undoes the last circuit change.",
    "Press ? to open the keyboard shortcuts.",
    "Use the Parameters panel when a rotation angle is symbolic.",
    "Multi view keeps your circuit and results visible together.",
    "Share links let you send a circuit without exporting a file.",
    "Psst: drag a gate from the palette onto me. I'm a little peckish.",
  ],
  "/learn": [
    "Quiz review brings back questions you are ready to practise again.",
    "Try Sandbox when you want a fresh circuit challenge.",
    "A small daily goal is enough to keep your learning streak moving.",
  ],
  "/challenges": [
    "Challenges are untimed, so focus on why each gate changes the state.",
    "Sandbox generates a fresh circuit to explore.",
    "Open Learn when you want a guided explanation before a challenge.",
  ],
  "/progress": [
    "Review is the fastest way to revisit weak topics.",
    "Your streak grows when you record activity on another day.",
    "Achievements add extra XP as you explore the site.",
  ],
  "/achievements": [
    "Try a different activity if you want to unlock another achievement.",
    "Some achievements reward consistency, not just finished lessons.",
    "Every unlocked achievement contributes XP to your level.",
  ],
  "/projects": [
    "Save a circuit when you want to return to it later.",
    "Open a project in Build to edit its gates and parameters.",
    "Export a project when you want to take it into another tool.",
  ],
  "/import": [
    "Paste Qiskit code to turn a real circuit into a visual one.",
    "Check the warning list after importing unsupported operations.",
    "Save an imported circuit when you want to keep editing it.",
  ],
  "/export": [
    "Choose an export target, then copy the generated code.",
    "Keep symbolic parameters when you want to tune a circuit later.",
    "The quantum-learn export uses x0, x1 and similar names for features.",
  ],
  "/review": [
    "Review questions are scheduled from your earlier answers.",
    "A careful second attempt is useful even when you remember the answer.",
    "Use the explanation after each answer to reinforce the idea.",
  ],
  "/docs": [
    "The docs explain the composer, assets, and translation details.",
    "Start with Composer if you want to learn the editing model.",
    "Asset Tracker shows which mascot resources are available.",
  ],
  "/roadmap": [
    "The roadmap shows where the visualizer is heading next.",
    "Tell the team which learning or circuit feature would help most.",
    "You can return to Build whenever an idea is ready to prototype.",
  ],
};

const help: Record<string, string> = {
  "/":
    "Home is your launchpad: start a circuit, pick a lesson, open a project, or import Qiskit code.",
  "/editor":
    "Build is where you compose and simulate circuits. Add gates, inspect their parameters, run the circuit, and share or export the result.",
  "/learn":
    "Learn guides you through short quantum-computing lessons. Choose a module, complete its build task, and review what you have practised.",
  "/challenges":
    "Challenges are practice puzzles for applying quantum ideas. Choose a challenge, inspect the target, and use the canvas to find a solution.",
  "/progress":
    "Progress collects your XP, level, streak, completed lessons, and topic strengths. Use Review to focus on material that needs another pass.",
  "/achievements":
    "Achievements celebrate milestones across Build, Learn, and your daily practice. Open one to see what it rewards and how much XP it adds.",
  "/projects":
    "Projects are saved circuits you can reopen, rename, edit, share, or export. Pick one to continue building where you left off.",
  "/import":
    "Import turns Qiskit code into an editable visual circuit. Paste code, inspect any warnings, and move into Build when it looks right.",
  "/export":
    "Export translates the current circuit into code for another tool. Choose a language, review the generated output, and copy it when ready.",
  "/review":
    "Quiz review schedules questions from your earlier practice. Answer a few carefully and use the feedback to strengthen weak topics.",
  "/docs":
    "Docs explain how to compose circuits, use the mascot assets, and understand translation or debugging details.",
  "/roadmap":
    "The roadmap gives a view of planned improvements and the direction of the visualizer. Explore it when you want to see what is next.",
};

export function greetingFor(
  context: PersonaContext
): { title?: string; text: string } | null {
  const path = normalizePath(context.path);

  if (path === "/") {
    if (context.firstVisit) {
      return {
        title: "Meet Quanta",
        text: "Hi, I'm Quanta! I live here now. Pick Build to make a circuit or Learn to start from zero — and yes, you can throw me.",
      };
    }
    if (context.streak > 0) {
      return {
        text: `Welcome back, ${context.levelTitle}. Day ${context.streak} streak — want to keep it going in Learn?`,
      };
    }
    return {
      text: `Welcome back! ${context.completedLessons} lessons done so far.`,
    };
  }

  if (/^\/learn\/[^/]+$/.test(path) || /^\/challenges\/[^/]+$/.test(path)) {
    return null;
  }

  const greetings: Record<string, string> = {
    "/editor":
      "Drag a gate onto a wire, then press Run — I'll show what changed in the state.",
    "/learn":
      "Start at the top if you're new; each lesson is a few minutes with a build task at the end.",
    "/challenges":
      "Challenges are timed-free puzzles. Sandbox gives you a fresh one every day.",
    "/progress":
      "Here's your XP, streak and weakest topics. Review fixes the weak ones fastest.",
    "/achievements": "These milestones show how far you have travelled across the site.",
    "/projects": "Your projects are waiting here whenever you want to keep building.",
    "/import": "Bring Qiskit code here and I will help you turn it into a circuit.",
    "/export": "Choose a target and I will help you take this circuit into code.",
    "/review": "A few careful review questions now can make the next lesson easier.",
    "/docs": "This is the reference shelf for composing, exporting, and understanding the site.",
    "/roadmap": "Here is the path ahead for the visualizer and its learning tools.",
  };

  return { text: greetings[path] ?? "Take a look around — I can help wherever you start." };
}

export function tipsFor(pathname: string): string[] {
  const path = normalizePath(pathname);
  if (tips[path]) return tips[path];
  if (path.startsWith("/docs/")) return tips["/docs"];
  return tips["/"];
}

export function pageHelpFor(pathname: string): string {
  const path = normalizePath(pathname);
  if (help[path]) return help[path];
  if (path.startsWith("/docs/")) return help["/docs"];
  if (path.startsWith("/learn/")) {
    return "This lesson combines a short explanation with a circuit task. Follow the steps, make the requested change, and use Build when you want to experiment further.";
  }
  if (path.startsWith("/challenges/")) {
    return "This challenge gives you a target circuit idea to solve. Read the prompt, edit the canvas, and run it to check your progress.";
  }
  return "Explore this page and use the navigation to choose your next quantum-computing step.";
}

const pokeReactions = [
  "Quack?",
  "Quack! That tickles.",
  "Hey! Quack. I'm a duck, not a button.",
  "QUACK. Last warning, friend.",
  "Q-QUACK!! I'm starting to feel loose...",
];

export function pokeReactionFor(pokes: number): string {
  return (
    pokeReactions[Math.min(pokes, pokeReactions.length) - 1] ?? pokeReactions[0]
  );
}

const recoveryLines: Record<"poked" | "thrown", string[]> = {
  poked: [
    "Quack... I popped. Found both eyes, most of my feathers. Please poke gently.",
    "That was one poke too many. Ducks are held together by pride and about forty feathers.",
    "Reassembled! Is my left eye on the right? Feels like it.",
  ],
  thrown: [
    "Quack! I'm a duck, not a frisbee. Give my feathers a minute to settle.",
    "Ducks fly. Ducks do not get flung. I have relearned this the hard way.",
    "Back in one piece. My eyes took the scenic route, but they're home.",
  ],
};

export function recoveryLineFor(reason: "poked" | "thrown"): string {
  const lines = recoveryLines[reason];
  return lines[Math.floor(Math.random() * lines.length)] ?? lines[0];
}

const wakeLines = [
  "Quack?! I wasn't sleeping. I was… collapsing my wave function.",
  "Mmf. Five more nanoseconds.",
  "Zzz— quack! Oh, hi. Did you build something while I napped?",
  "I dreamt I was a photon. Very fast, very tired now.",
];

export function wakeLine(): string {
  return wakeLines[Math.floor(Math.random() * wakeLines.length)] ?? wakeLines[0];
}

export function runReactionFor(result: {
  shots: number;
  histogram: Array<{ probability?: number; count?: number }>;
}): string {
  const topCount = Math.max(
    0,
    ...result.histogram.map((entry) => entry.count ?? 0)
  );
  const topShare = result.shots > 0 ? topCount / result.shots : 0;

  if (result.histogram.length === 1) {
    const lines = [
      "One outcome, every shot. Deterministic as a duck to bread.",
      `All ${result.shots} shots agree. Not a single surprise. Suspiciously classical.`,
    ];
    return lines[result.shots % lines.length] ?? lines[0];
  }

  if (topShare <= 0.6 && result.histogram.length >= 2) {
    const lines = [
      `Ooh, a proper spread over ${result.histogram.length} outcomes. That's superposition talking.`,
      `${result.histogram.length} outcomes and none of them boring. Quack of approval.`,
    ];
    return lines[result.shots % lines.length] ?? lines[0];
  }

  const top = Math.round(topShare * 100);
  const lines = [
    `Mostly ${top}% one way, with a few rebels. I like the rebels.`,
    `${result.shots} shots in. Nice run — want me to explain the histogram?`,
  ];
  return lines[result.shots % lines.length] ?? lines[0];
}

export function runErrorReaction(error: string): string {
  return error.length < 80
    ? `${error} Quack. Fix that and I'll flap my wings for you.`
    : "That circuit didn't run. Check the panel message, then try again — quack.";
}

const duckQuips = [
  "Quack. Sorry, that one slipped out.",
  "Fun fact: I'm a duck. A quantum one, but mostly a duck.",
  "Superposition is easy. Try floating and paddling at the same time.",
  "Rubber-duck debugging works better with a real duck. Talk to me.",
  "If you're wondering, yes, I would like bread. Qubits are fine too.",
  "I measured myself once. Still a duck. Wave function: fluffy.",
  "Entanglement? Try untangling a duck from a fishing line.",
  "Waddling is just walking with more personality.",
];

export function randomDuckQuip(): string {
  return (
    duckQuips[Math.floor(Math.random() * duckQuips.length)] ?? duckQuips[0]
  );
}
