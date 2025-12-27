/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        serverActions: true,
    },
    images: {
        unoptimized: true,
    },
    // Additional configuration for Vercel deployment
    trailingSlash: false,
    // For handling asset prefixes in production
    assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
};

export default nextConfig;