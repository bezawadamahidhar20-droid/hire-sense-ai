import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse-fork", "mammoth"],
  // Dev mode: Next.js blocks Server Action / dev-asset requests whose Origin
  // isn't localhost. If you open the dev server through a tunnel, remote
  // port, or preview proxy, add that host here (wildcards allowed).
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    // "*.app.github.dev",            // GitHub Codespaces
    // "*.your-preview-platform.app", // preview/tunnel domains
  ],
  experimental: {
    serverActions: {
      // Production Server Action CSRF check: the request's Origin is compared
      // against the app's Host. If they differ (preview links, ngrok, custom
      // domains), Next.js rejects the POST with a 400 BEFORE your action runs.
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        // Add the EXACT domain from your browser's address bar, no protocol,
        // no trailing slash, keep the port if one is shown:
        // "abc123.your-preview-platform.app",
        // Wildcards match subdomains only (the apex needs its own entry):
        // "*.your-preview-platform.app",
      ],
    },
  },
};

export default nextConfig;
