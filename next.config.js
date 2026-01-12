/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'mssql': 'commonjs mssql'
      });
    }
    return config;
  }
}

module.exports = nextConfig