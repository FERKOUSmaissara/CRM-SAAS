/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    // Keep conservative experimental flags; adjust if needed for Vercel/Turbopack
  },
};

module.exports = nextConfig;
