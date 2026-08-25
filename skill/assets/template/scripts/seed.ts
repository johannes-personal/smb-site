/**
 * Seeds facts, pages and collection items from content/*.json.
 * Run once after creating the Supabase project: npm run seed
 */
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const siteId = process.env.NEXT_PUBLIC_SITE_ID ?? "default";
// Accepts the new secret key (sb_secret_…) or the legacy service_role key,
// which Supabase retires at the end of 2026.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error(
    "Zet NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SECRET_KEY in .env.local — zie docs/developer-setup.md."
  );
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const facts = JSON.parse(readFileSync("content/facts.json", "utf8"));
const pages = JSON.parse(readFileSync("content/pages.json", "utf8"));

const { error: factsError } = await supabase
  .from("facts")
  .upsert({ site_id: siteId, data: facts });
if (factsError) throw factsError;

for (const [slug, page] of Object.entries<any>(pages)) {
  const { error } = await supabase
    .from("pages")
    .upsert({ site_id: siteId, slug, title: page.title, data: page.data, published: true },
            { onConflict: "site_id,slug" });
  if (error) throw error;
}

// Collections are seeded in batches: a migrated catalogue can be thousands of
// rows and a single upsert of that size times out.
let itemCount = 0;
if (existsSync("content/collections.json")) {
  const collections = JSON.parse(readFileSync("content/collections.json", "utf8"));
  for (const [collection, items] of Object.entries<any[]>(collections)) {
    for (let i = 0; i < items.length; i += 500) {
      const batch = items.slice(i, i + 500).map((item) => ({
        site_id: siteId,
        collection,
        slug: item.slug,
        data: item.data,
        published: item.published ?? true,
      }));
      const { error } = await supabase
        .from("collection_items")
        .upsert(batch, { onConflict: "site_id,collection,slug" });
      if (error) throw error;
      itemCount += batch.length;
    }
    console.log(`  ${collection}: ${items.length}`);
  }
}

console.log(
  `Seeded facts, ${Object.keys(pages).length} pages and ${itemCount} collection items for site "${siteId}".`
);
