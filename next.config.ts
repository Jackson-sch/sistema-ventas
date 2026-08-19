import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "*.tunnelmole.net",
        "*.tunnelmole.com",
        "w0ciua-ip-179-7-16-186.tunnelmole.net",
        "*.ngrok-free.app",
        "*.ngrok.io",
        "*.loca.lt",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
