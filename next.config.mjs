/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['*.azurewebsites.net'],
    },
  },
};

export default nextConfig;
