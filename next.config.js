/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qidkphnuymbgdnalsqka.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Ensure static export works properly
  trailingSlash: true,
  // Handle environment variables gracefully
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
