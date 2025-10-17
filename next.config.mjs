/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hapus swcMinify
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/',
      },
    ];
  },
}

export default nextConfig
