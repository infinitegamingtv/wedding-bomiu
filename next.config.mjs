/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.WEDDING_BUILD_DIR || '.next',
  turbopack: { root: process.cwd() },
};

export default nextConfig;
