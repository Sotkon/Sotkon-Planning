import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  eslint: {
  ignoreDuringBuilds: true, // Mantém ativo
},
};

export default nextConfig;
