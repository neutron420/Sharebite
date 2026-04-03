import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";



const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "pub-f52c80e42ca24e4b939af0c67a57ec9b.r2.dev",
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

export default withPWA(nextConfig);
