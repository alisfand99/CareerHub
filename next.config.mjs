/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["framer-motion"],
  // No custom webpack / onDemandEntries — defaults avoid stale dev chunks after refactors.
};

export default nextConfig;
