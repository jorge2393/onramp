/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable TypeScript and ESLint checks during build for Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['www.crossmint.com', 'crossmint.com'],
    // Enable image optimization
    formats: ['image/avif', 'image/webp'],
  },
  // Necessary for Crossmint authentication to work properly
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
  // Performance optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  swcMinify: true, // Use SWC minifier for better performance
  // Optimize third-party script loading
  experimental: {
    optimizeCss: true, // Optimize CSS
    scrollRestoration: true, // Better scroll handling
  },
  // Reduce bundle size by excluding certain libraries from client bundle
  webpack: (config, { isServer }) => {
    // Only include persona in client bundle
    if (isServer) {
      config.externals = [...(config.externals || []), 'persona'];
    }
    return config;
  },
};

export default nextConfig; 