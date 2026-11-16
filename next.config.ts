import type { NextConfig } from "next";

// Frontend-only build: `npm run build` writes a static site to ./out.
// On GitHub Pages the site lives under /<repo-name>, so the deploy workflow
// sets NEXT_PUBLIC_BASE_PATH (e.g. "/Build-Core"). Locally it stays empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
