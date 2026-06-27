import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/layout/app-header";
import { ThemeProvider } from "@/components/layout/theme-provider";

export const metadata: Metadata = {
  title: "Qiskit Visualizer",
  description:
    "Build, view, and convert quantum circuits between visual diagrams and Qiskit Python code",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <AppHeader />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
