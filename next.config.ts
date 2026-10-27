import type { NextConfig } from "next";

const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Fotos ilustrativas (src/data/photos.json). Remova se usar só fotos locais.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
    deviceSizes: [420, 640, 828, 1080, 1280, 1600, 1920],
  },
  async headers() {
    // Frames da sequência e renders mudam de nome quando mudam de conteúdo — cache longo.
    return [
      { source: "/sequence/:path*", headers: immutable },
      { source: "/models/:path*", headers: immutable },
    ];
  },
};

export default nextConfig;
