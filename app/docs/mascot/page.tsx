"use client";

import { QuantaImage } from "@/components/mascot/QuantaImage";
import { PageActions } from "@/components/navigation/PageActions";
import {
  quantaUsageGuide,
  getQuantaAssetPath,
  type QuantaVariant,
} from "@/lib/quanta-assets";
import { GraduationCap, Palette, PenLine } from "lucide-react";

export default function QuantaMascotDocsPage() {
  return (
    <div className="page-container max-w-5xl">
      <div className="page-header mb-8">
        <p className="qci-section-eyebrow">Docs · Mascot Assets</p>
        <h1 className="page-title text-3xl">Quanta mascot gallery</h1>
        <p className="page-description mt-3 max-w-2xl">
          Official Quanta images for the Quantum Circuit Visualizer. Use the
          centralized registry in{" "}
          <code className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-xs">
            lib/quanta-assets.ts
          </code>{" "}
          so paths can swap to transparent PNG/WebP later without changing
          components.
        </p>
        <PageActions
          className="mt-5"
          primary={[
            { label: "Open Build", href: "/editor", icon: <PenLine className="h-4 w-4" /> },
          ]}
          secondary={[
            {
              label: "Asset Tracker",
              href: "/docs/assets",
              icon: <Palette className="h-4 w-4" />,
            },
            {
              label: "Learn",
              href: "/learn",
              icon: <GraduationCap className="h-4 w-4" />,
            },
          ]}
        />
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          Recommended usage
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quantaUsageGuide.map((item) => (
            <article
              key={item.variant}
              className="technical-panel flex flex-col gap-3 p-4"
            >
              <QuantaImage variant={item.variant as QuantaVariant} size="md" />
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                  {item.label}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                  {item.usage}
                </p>
                <p className="mono-label mt-2 break-all text-[0.6rem] text-[var(--color-muted-foreground)]">
                  {getQuantaAssetPath(item.variant)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="technical-panel mb-10 p-5">
        <h2 className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">
          Chat with Quanta (Gemini)
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          Chat uses a shared Gemini key when the site is built with{" "}
          <code className="font-mono text-xs">
            NEXT_PUBLIC_QUANTA_GEMINI_API_KEY
          </code>
          ; visitors can paste their own key instead, stored only in this
          browser and sent directly to Google. It runs on{" "}
          <code className="font-mono text-xs">gemini-3.5-flash-lite</code> and
          keeps replies, history, and page context short to save tokens.
        </p>
      </section>

      <section className="technical-panel p-5">
        <h2 className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">
          Design notes
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-[var(--color-muted-foreground)]">
          <li>
            Assets are transparent WebP files under{" "}
            <code className="font-mono text-xs">public/assets/quanta/</code>.
          </li>
          <li>
            Prefer{" "}
            <code className="font-mono text-xs">QuantaCard</code>,{" "}
            <code className="font-mono text-xs">QuantaTip</code>,{" "}
            <code className="font-mono text-xs">QuantaEmptyState</code>, and{" "}
            <code className="font-mono text-xs">QuantaAchievement</code> over
            raw image tags.
          </li>
          <li>
            Keep Build/editor mostly mascot-free — use Quanta only for tips,
            empty states, errors, or onboarding.
          </li>
          <li>
            Paths go through{" "}
            <code className="font-mono text-xs">getQuantaAssetUrl()</code> so
            GitHub Pages{" "}
            <code className="font-mono text-xs">/Quantum-Circuit-Visualizer/</code>{" "}
            base path works.
          </li>
          <li>
            The 128px buddy sprite set in{" "}
            <code className="font-mono text-xs">assets/quanta/buddy/</code>{" "}
            was ported from the Quanta browser extension.
            Quanta now greets you, offers tips, follows page clicks, and opens a
            help menu when you ask.
          </li>
        </ul>
      </section>
    </div>
  );
}
