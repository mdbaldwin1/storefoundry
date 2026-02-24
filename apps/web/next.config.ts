import path from "node:path";
import type { NextConfig } from "next";

const isVercelBuild = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: isVercelBuild ? path.resolve(__dirname) : path.resolve(__dirname, "../..")
  }
};

export default nextConfig;
