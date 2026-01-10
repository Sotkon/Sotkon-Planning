/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Incluir arquivos do Prisma no build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client'
      });
    }
    return config;
  },
  // Copiar schema do Prisma
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  }
}

module.exports = nextConfig