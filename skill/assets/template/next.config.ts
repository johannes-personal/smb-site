import type { NextConfig } from "next";

// Redirects are generated from harvest/redirects.csv in Phase 2.
// Losing the old URLs costs the business its search ranking, so this list
// should be complete before the domain is pointed at the new site.
const config: NextConfig = {
  // The engine ships TypeScript source rather than a build, so Next compiles
  // it — which also means this project's own typecheck covers the engine.
  transpilePackages: ["@smb-site/engine"],
  images: { remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }] },
  async redirects() {
    return [
      // { source: "/oude-pagina.html", destination: "/nieuwe-pagina", permanent: true },
    ];
  },
};

export default config;
