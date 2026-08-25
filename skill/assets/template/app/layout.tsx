import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { getFacts } from "@/lib/facts";
import { localBusinessJsonLd } from "@smb-site/engine";
import "./globals.css";

// The root layout reads facts, so every route under it — including Next's
// built-in /_not-found — needs the database. Without this the build tries to
// prerender the 404 page and fails before it reaches any of our own routes.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const facts = await getFacts();
  return {
    title: { default: facts.meta.siteName, template: `%s | ${facts.meta.siteName}` },
    description: facts.meta.tagline,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const facts = await getFacts();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <html lang={facts.meta.language ?? "nl"}>
      <body>
        <a href="#inhoud" className="sr-only focus:not-sr-only focus:absolute focus:p-3">
          Direct naar de inhoud
        </a>
        <main id="inhoud">{children}</main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd(facts, siteUrl)),
          }}
        />
        {/* Cookieless, so the site needs no consent banner. */}
        <Analytics />
      </body>
    </html>
  );
}
