/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // ✅ evita errores en desarrollo
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {},
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.aesthetics-blog.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
      {
        protocol: 'https',
        hostname: 'vitruve.fit',
      },
      {
        protocol: 'https',
        hostname: 'boxlifemagazine.com',
      },
      {
        protocol: 'https',
        hostname: 'fitcron.com',
      },
      {
        protocol: 'https',
        hostname: 'menspower.nl',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
