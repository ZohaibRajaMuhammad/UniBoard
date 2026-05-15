/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.VERCEL ? ".next" : process.env.NODE_ENV === "production" ? ".next-release" : ".next",
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid stale/missing .next artifacts on this Windows setup.
      config.cache = false;
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  }
};

export default nextConfig;
