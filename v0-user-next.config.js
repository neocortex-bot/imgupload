/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_DOMAIN?.replace('https://', '').replace('http://', '') || ''],
  },
}

module.exports = nextConfig

