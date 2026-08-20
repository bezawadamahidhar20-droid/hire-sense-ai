import type { NextConfig } from "next";

// Extra origins allowed to call Server Actions, set via the ALLOWED_ORIGINS
// env var (comma-separated, no protocol, keep ports: "app.example.com,
// *.preview.example.com"). Next.js rejects Server Action POSTs whose Origin
// doesn't match the app's own Host with a 400 before the action runs; the
// dev server applies an equivalent check via allowedDevOrigins.
// Plain localhost is allowed by default in both checks.
const extraOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse-fork", "mammoth"],
  allowedDevOrigins: extraOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: extraOrigins,
      // Resume uploads allow files up to 5MB; the Server Action default body
      // cap is 1MB, which would reject them with a 413 before validation.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;