/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["framer-motion"],
  // No custom webpack / onDemandEntries — defaults avoid stale dev chunks after refactors.
  async rewrites() {
    // Next injects `<link rel="icon" href="/favicon.ico" ...>` even when only a PNG exists; without
    // a real file, browsers fall back to the host default (e.g. Vercel triangle). Serve our logo.
    return [{ source: "/favicon.ico", destination: "/careerhub-logo.png" }];
  },
  async headers() {
    return [
      {
        source: "/favicon.ico",
        headers: [{ key: "Content-Type", value: "image/png" }],
      },
    ];
  },
};

export default nextConfig;
