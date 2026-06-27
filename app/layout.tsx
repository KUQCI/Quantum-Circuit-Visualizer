import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/layout/app-header";

export const metadata: Metadata = {
  title: "Qiskit Visualizer",
  description: "Build, view, and convert quantum circuits between visual diagrams and Qiskit Python code",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AppHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
