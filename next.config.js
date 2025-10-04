/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["api.dicebear.com"],
  },
  // Enable SWC minification for better performance
  swcMinify: true,
};

module.exports = nextConfig;
