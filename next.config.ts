import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // F3.1: keluaran statis penuh (disajikan dari out/, siap hosting file statis).
  output: "export",
  images: {
    // next/image tanpa server optimasi (wajib untuk output export).
    unoptimized: true,
  },
};

export default nextConfig;
