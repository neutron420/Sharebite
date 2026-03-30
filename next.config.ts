import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/dashboard/requests/:path*',
        destination: '/ngo/requests/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
