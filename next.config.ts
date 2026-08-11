import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["@napi-rs/canvas", "sharp", "pdfjs-dist", "pdfkit"],
  // Book uploads can be large (24-page JPG sets, big PDFs) — the default
  // request body limit is 10 MB, which silently truncates bigger uploads.
  experimental: {
    proxyClientMaxBodySize: "150mb",
  },
};

export default nextConfig;
