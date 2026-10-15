import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Documentation | Quantum Circuit Visualizer",
  description:
    "Guides and references for building, debugging, and learning with quantum circuits.",
};

const DOCS_PAGES = [
  {
    href: "/docs/api",
    title: "IBM Quantum API Reference",
    description:
      "Execute exported Qiskit or OpenQASM circuits on IBM Quantum simulators or hardware.",
  },
  {
    href: "/docs/assets",
    title: "Artist asset tracker",
    description:
      "Follow the internal art pipeline, placeholders, and requirements for project assets.",
  },
  {
    href: "/docs/composer",
    title: "Quantum Circuit Composer Guide",
    description:
      "Build quantum circuits on the canvas, inspect their state, and generate code.",
  },
  {
    href: "/docs/debug",
    title: "Translator debug",
    description:
      "Inspect Circuit IR, semantic validation, and the Qiskit generate/parse path.",
  },
  {
    href: "/docs/mascot",
    title: "Quanta mascot gallery",
    description:
      "Browse official Quanta images and the centralized mascot asset registry.",
  },
] as const;

export default function DocsIndexPage() {
  return (
    <div className="page-container max-w-5xl">
      <div className="page-header mb-8">
        <p className="qci-section-eyebrow">Documentation</p>
        <h1 className="page-title text-3xl">Documentation</h1>
        <p className="page-description mt-3 max-w-2xl">
          Guides and references for the Quantum Circuit Visualizer.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {DOCS_PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="group block h-full"
          >
            <Card className="h-full transition-colors group-hover:border-[var(--color-brand-border)]">
              <CardHeader>
                <CardTitle>{page.title}</CardTitle>
                <CardDescription>{page.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
