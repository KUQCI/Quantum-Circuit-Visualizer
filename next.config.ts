import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_APP_NAME: "Qiskit Visualizer",
    NEXT_PUBLIC_APP_VERSION: "1.0.0",
  },
};

export default nextConfig;
