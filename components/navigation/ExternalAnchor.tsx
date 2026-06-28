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

export const KUQCI_HOME_URL = "https://kuqci.github.io/";
