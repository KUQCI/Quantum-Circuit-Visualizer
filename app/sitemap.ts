import type { MetadataRoute } from "next";
import { CHALLENGE_IDS } from "@/lib/learning/challenges";
import { LESSON_IDS } from "@/lib/learning/lessons";

export const dynamic = "force-static";

const SITE_URL = "https://qcinit.tech/Quantum-Circuit-Visualizer";

const STATIC_ROUTES = [
  "/",
  "/editor",
  "/learn",
  "/classroom",
  "/progress",
  "/achievements",
  "/projects",
  "/review",
  "/export",
  "/import",
  "/challenges",
  "/challenges/sandbox",
  "/docs/api",
  "/docs/assets",
  "/docs/composer",
  "/docs/debug",
  "/docs/mascot",
  "/roadmap",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ...STATIC_ROUTES,
    ...LESSON_IDS.map((lessonId) => `/learn/${lessonId}`),
    ...CHALLENGE_IDS.map((challengeId) => `/challenges/${challengeId}`),
  ];

  return routes.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "/" : `${path}/`}`,
  }));
}
