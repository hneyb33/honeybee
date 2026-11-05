import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // OpenNext (`npm run build:cf`) copies traced files from `.next/standalone`;
  // without this the Cloudflare bundle step fails with ENOENT on .next/standalone.
  output: "standalone",
  images: {
    // Custom loader: R2 serves fixed pre-generated variants, arbitrary `?w=`
    // resizing must never reach the origin (transformation cost trap). Legacy
    // Cloudinary/Supabase URLs pass through untouched.
    loader: "custom",
    loaderFile: "./src/lib/media-image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.honeysbees.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
