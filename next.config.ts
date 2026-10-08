import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El service worker no se guarda en caché para que las versiones nuevas
  // lleguen enseguida.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
