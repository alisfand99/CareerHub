/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["framer-motion"],
  // Keep compiled route modules in memory longer in dev (fewer stale chunk mismatches).
  onDemandEntries: {
    maxInactiveAge: 120 * 1000,
    pagesBufferLength: 8,
  },
};

export default nextConfig;
