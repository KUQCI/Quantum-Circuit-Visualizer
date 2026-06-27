import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repoName = process.env.GITHUB_REPOSITORY_NAME ?? "Quantum-Circuit-Visualizer";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isGitHubPages
    ? {
        output: "export" as const,
        trailingSlash: true,
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
      }
    : {}),
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_NAME: "KUQCI Circuit Visualizer",
    NEXT_PUBLIC_APP_VERSION: "1.0.0",
    NEXT_PUBLIC_BASE_PATH: isGitHubPages ? `/${repoName}` : "",
  },
};

export default nextConfig;
