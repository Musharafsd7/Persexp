/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // static site -> bundled into the Android app by Capacitor
  images: { unoptimized: true },
  trailingSlash: true,
}

export default nextConfig
