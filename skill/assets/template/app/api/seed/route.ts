import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase";
import { getUser } from "@/lib/supabase-server";

import facts from "@/content/facts.json";
import pages from "@/content/pages.json";
import collections from "@/content/collections.json";
import { clearFactsCache } from "@/lib/facts";

export const dynamic = "force-dynamic";
// A few thousand rows in batches of 500 takes several seconds; the default
// 10s is tight for any project with a real catalogue.
export const maxDuration = 60;

/**
 * Loads content/*.json into Supabase, from the deployed application.
 *
 * The alternative — `npm run seed` — needs a checkout, a Node install and the
 * secret key on somebody's laptop. That is a real barrier for whoever
 * maintains this in three years, and it means the project cannot be run from a
 * browser and a cloud session alone. This route does the same work using the
 * credentials Vercel already holds.
 *
 * Idempotent: everything upserts on its natural key, so running it twice is
 * harmless. It does not delete, so a product removed from content/ stays in the
 * database until someone removes it deliberately.
 *
 * Requires a signed-in session — the same check /api/publish uses.
 */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const siteId = process.env.NEXT_PUBLIC_SITE_ID ?? "default";
  const supabase = createAdminClient();
  const done: Record<string, number> = {};

  const { error: factsError } = await supabase
    .from("facts")
    .upsert({ site_id: siteId, data: facts, updated_at: new Date().toISOString() });
  if (factsError) {
    return NextResponse.json({ error: `facts: ${factsError.message}` }, { status: 500 });
  }
  done.facts = 1;

  const pageRows = Object.entries(pages as Record<string, any>)
    // Keys beginning with "_" are editorial notes in the JSON, not pages.
    .filter(([slug, page]) => !slug.startsWith("_") && page?.data)
    .map(([slug, page]) => ({
      site_id: siteId,
      slug,
      title: page.title ?? slug,
      data: page.data,
      published: true,
      updated_at: new Date().toISOString(),
    }));
  const { error: pagesError } = await supabase
    .from("pages")
    .upsert(pageRows, { onConflict: "site_id,slug" });
  if (pagesError) {
    return NextResponse.json({ error: `pages: ${pagesError.message}` }, { status: 500 });
  }
  done.pages = pageRows.length;

  // Batched: a single upsert of a few thousand rows times out.
  for (const [collection, items] of Object.entries(
    collections as Record<string, { slug: string; data: any; published?: boolean }[]>
  )) {
    // content/*.json still holds the image URLs as they were harvested, from
    // the old server. /api/migrate-media later copied those files into Supabase
    // Storage and rewrote the rows. A blind re-seed would therefore quietly
    // undo the migration and point 879 products back at a server that is going
    // away — so anything already hosted by us wins over what the file says.
    const { data: existing } = await supabase
      .from("collection_items")
      .select("slug, data")
      .eq("site_id", siteId)
      .eq("collection", collection);
    const keepImage = new Map<string, string>();
    for (const row of existing ?? []) {
      const url = String((row.data as any)?.image ?? "");
      if (url.includes("/storage/v1/object/")) keepImage.set(row.slug, url);
    }

    let written = 0;
    let preserved = 0;
    for (let i = 0; i < items.length; i += 500) {
      const batch = items.slice(i, i + 500).map((item) => {
        const hosted = keepImage.get(item.slug);
        if (hosted && hosted !== item.data.image) preserved++;
        return {
          site_id: siteId,
          collection,
          slug: item.slug,
          data: hosted ? { ...item.data, image: hosted } : item.data,
          published: item.published ?? true,
          updated_at: new Date().toISOString(),
        };
      });
      const { error } = await supabase
        .from("collection_items")
        .upsert(batch, { onConflict: "site_id,collection,slug" });
      if (error) {
        return NextResponse.json(
          { error: `${collection}: ${error.message}`, partial: { ...done, [collection]: written } },
          { status: 500 }
        );
      }
      written += batch.length;
    }
    done[collection] = written;
    if (preserved) done[`${collection}_foto_behouden`] = preserved;
  }

  clearFactsCache();
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, geladen: done });
}
