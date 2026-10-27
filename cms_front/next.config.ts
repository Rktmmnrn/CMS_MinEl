import type { NextConfig } from "next";

// URL du backend Django en développement
const backend = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",

  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/admin/:path*", destination: `${backend}/admin/:path*` },
      { source: "/static/:path*", destination: `${backend}/static/:path*` },
      { source: "/mediafiles/:path*", destination: `${backend}/mediafiles/:path*` },
    ];
  },
};

export default nextConfig;
