import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://qcinit.tech/Quantum-Circuit-Visualizer/"
  ),
  title: "Quantum Circuit Visualizer | QCI",
  description:
    "An open-source QCI R&D project for learning and prototyping quantum circuits — build, view, and convert between visual diagrams and Qiskit, OpenQASM, and Cirq.",
  openGraph: {
    title: "Quantum Circuit Visualizer | QCI",
    description:
      "Learn and prototype quantum circuits with an approachable visual builder from the Khalifa University Quantum Computing Initiative.",
    siteName: "Quantum Circuit Visualizer",
    type: "website",
    images: [
      {
        url: "/assets/og-card.jpg",
        width: 1200,
        height: 630,
        alt: "Quanta welcomes you to Quantum Circuit Visualizer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quantum Circuit Visualizer | QCI",
    description:
      "Learn and prototype quantum circuits with an approachable visual builder from the Khalifa University Quantum Computing Initiative.",
    images: ["/assets/og-card.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("qiskit-visualizer-theme");if(s){var t=JSON.parse(s).state.theme;if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-0 antialiased font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
