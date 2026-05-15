/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['sanity', 'next-sanity', '@sanity/ui', '@sanity/icons'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
}

export default nextConfig
