import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "s7g10.scene7.com" },
      { protocol: "https", hostname: "filtron.eu" },
    ],
  },
  // iyzipay paketi fs.readdirSync + dinamik require ile resource dosyalarını yüklüyor;
  // Turbopack/Webpack statik analiz edemediği için node-side external olarak bırakıyoruz.
  serverExternalPackages: ["iyzipay"],
};

export default nextConfig;
