import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs"],
  images: {
    // Serve AVIF/WebP para todas as <Image> (logos de auth, /img-lp da landing).
    // Zero mudança de código; imagens menores → LCP melhor nas páginas públicas.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
