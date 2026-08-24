import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * Use for external URLs (including same-origin sites outside this app's basePath).
 * Next.js <Link> will RSC-prefetch same-origin absolute URLs at the wrong path on GitHub Pages.
 */
export function ExternalAnchor({
  href,
  className,
  children,
  target = "_blank",
  rel = "noopener noreferrer",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      {...props}
    >
      {children}
    </a>
  );
}

/** Main Quantum Computing Initiative site (qcinit.tech). */
export const QCI_HOME_URL = "https://qcinit.tech/";

/** @deprecated Prefer QCI_HOME_URL — kept for any remaining imports. */
export const KUQCI_HOME_URL = QCI_HOME_URL;

export const QCI_RD_URL = "https://qcinit.tech/rd";
export const QCI_GITHUB_ORG = "https://github.com/KUQCI";
export const QCI_VISUALIZER_REPO =
  "https://github.com/KUQCI/Quantum-Circuit-Visualizer";
