/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" }
    ]
  },
  distDir: process.env.WEDDING_BUILD_DIR || '.next',
  turbopack: { root: process.cwd() },
};

export default nextConfig;
