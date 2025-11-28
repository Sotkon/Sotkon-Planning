/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed standalone for simpler deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig