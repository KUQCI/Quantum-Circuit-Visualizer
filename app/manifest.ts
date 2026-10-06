import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quantum Circuit Visualizer | QCI",
    short_name: "QCI Circuits",
    description:
      "An open-source QCI R&D project for learning and prototyping quantum circuits — build, view, and convert between visual diagrams and Qiskit, OpenQASM, and Cirq.",
    id: `${BASE}/`,
    start_url: `${BASE}/`,
    scope: `${BASE}/`,
    display: "standalone",
    background_color: "#050914",
    theme_color: "#050914",
    icons: [
      {
        src: `${BASE}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${BASE}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${BASE}/icons/icon-maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Build", url: `${BASE}/editor/` },
      { name: "Learn", url: `${BASE}/learn/` },
    ],
  };
}
