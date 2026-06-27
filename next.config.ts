import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true";
const basePath = isStaticExport ? "/CryptoForge" : "";

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : "standalone",
  basePath,
  assetPrefix: isStaticExport ? "/CryptoForge/" : "",
  images: {
    unoptimized: isStaticExport,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Expose basePath to client-side code so <img src> can use it
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
