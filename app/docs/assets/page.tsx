import Link from "next/link";
import {
  ARTIST_ASSET_REQUIREMENTS,
  type AssetPriority,
  type AssetStatus,
} from "@/lib/artist-assets";
import { PageActions } from "@/components/navigation/PageActions";
import { ArtistAssetPlaceholder } from "@/components/assets/ArtistAssetPlaceholder";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { PenLine, GraduationCap, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const priorityClass: Record<AssetPriority, string> = {
  P0: "border-[var(--color-gold-duck)]/40 text-[var(--color-gold-duck)]",
  P1: "border-[var(--color-brand-border)] text-[var(--color-brand)]",
  P2: "border-[var(--color-border)] text-[var(--color-muted-foreground)]",
};

const statusClass: Record<AssetStatus, string> = {
  needed: "text-[#c084fc]",
  "in-progress": "text-[var(--color-brand)]",
  review: "text-[var(--color-gold-duck)]",
  done: "text-[var(--color-success)]",
};

export default function AssetTrackerPage() {
  return (
    <div className="page-container max-w-4xl">
      <div className="page-header mb-8">
        <p className="qci-section-eyebrow">Docs · Internal</p>
        <h1 className="page-title text-3xl">Artist asset tracker</h1>
        <p className="page-description mt-3 max-w-2xl">
          Internal art pipeline for the Quantum Circuit Visualizer. Public Home
          keeps a polished banner only — detailed placeholders and requirements
          live here. Structured so it can move to Notion later.
        </p>
        <PageActions
          className="mt-5"
          primary={[
            { label: "Open Build", href: "/editor", icon: <PenLine className="h-4 w-4" /> },
          ]}
          secondary={[
            {
              label: "Composer guide",
              href: "/docs/composer",
              icon: <GraduationCap className="h-4 w-4" />,
            },
            { label: "Home", href: "/", icon: <Palette className="h-4 w-4" /> },
          ]}
        />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <ArtistAssetPlaceholder assetId="quantum-journey-banner" aspect="banner" />
        <div className="technical-panel flex flex-col items-center justify-center gap-3 p-4">
          <p className="mono-label text-[0.65rem] text-[var(--color-muted-foreground)]">
            Quanta teacher (official)
          </p>
          <QuantaImage variant="learning" size="lg" />
          <Link
            href="/docs/mascot"
            className="text-xs text-[var(--color-brand)] hover:underline"
          >
            Open Quanta asset gallery →
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="mono-label px-4 py-3 text-[0.65rem] text-[var(--color-muted-foreground)]">
                Asset
              </th>
              <th className="mono-label px-3 py-3 text-[0.65rem] text-[var(--color-muted-foreground)]">
                Priority
              </th>
              <th className="mono-label px-3 py-3 text-[0.65rem] text-[var(--color-muted-foreground)]">
                Owner
              </th>
              <th className="mono-label px-3 py-3 text-[0.65rem] text-[var(--color-muted-foreground)]">
                Due
              </th>
              <th className="mono-label px-3 py-3 text-[0.65rem] text-[var(--color-muted-foreground)]">
                Status
              </th>
              <th className="mono-label px-4 py-3 text-[0.65rem] text-[var(--color-muted-foreground)]">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {ARTIST_ASSET_REQUIREMENTS.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--color-border)]/70 align-top last:border-0"
              >
                <td className="px-4 py-4">
                  <p className="font-medium text-[var(--color-foreground)]">{row.title}</p>
                  <p className="mono-label mt-1 text-[0.6rem] text-[var(--color-muted-foreground)]">
                    {row.id}
                  </p>
                  {row.dimensions && (
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                      {row.dimensions}
                    </p>
                  )}
                </td>
                <td className="px-3 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 font-mono text-[0.65rem]",
                      priorityClass[row.priority]
                    )}
                  >
                    {row.priority}
                  </span>
                </td>
                <td className="px-3 py-4 text-[var(--color-muted-foreground)]">
                  {row.owner}
                </td>
                <td className="px-3 py-4 text-[var(--color-muted-foreground)]">
                  {row.dueDate}
                </td>
                <td className={cn("px-3 py-4 font-medium capitalize", statusClass[row.status])}>
                  {row.status}
                </td>
                <td className="max-w-xs px-4 py-4 leading-relaxed text-[var(--color-muted-foreground)]">
                  {row.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-[var(--color-muted-foreground)]">
        Placeholders in the UI are tagged with{" "}
        <code className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-xs">
          data-artist-asset
        </code>
        . Search the repo for{" "}
        <Link href="/" className="text-[var(--color-brand)] hover:underline">
          ArtistAssetPlaceholder
        </Link>{" "}
        when swapping final art.
      </p>
    </div>
  );
}
