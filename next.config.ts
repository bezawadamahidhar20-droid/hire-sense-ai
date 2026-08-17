import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse-fork", "mammoth"],
};

export default nextConfig;
