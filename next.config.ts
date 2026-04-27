import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "s7g10.scene7.com" },
      { protocol: "https", hostname: "filtron.eu" },
    ],
  },
};

export default nextConfig;
