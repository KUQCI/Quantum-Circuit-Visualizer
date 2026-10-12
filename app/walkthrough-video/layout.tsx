import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Walkthrough video",
  robots: { index: false, follow: false },
};

export default function WalkthroughVideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
