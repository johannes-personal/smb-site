import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase";
import { getUser } from "@/lib/supabase-server";
import { COLLECTIONS, labelsFrom } from "@/lib/collections";
import { clearFactsCache, getFacts } from "@/lib/facts";
import { taxonomyProblems } from "@smb-site/engine";

export const dynamic = "force-dynamic";

/** Writes go through here so the service-role key never reaches the browser.
 *  Every write is checked against a real signed-in session first. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const body = await request.json();
  const siteId = process.env.NEXT_PUBLIC_SITE_ID ?? "default";
  const supabase = createAdminClient();

  if (body.kind === "facts") {
    // The taxonomy ids are in every product URL, so dropping one in use would
    // 404 every page under it. Checked here rather than only in the editor, so
    // a stale tab or a direct call cannot get round it.
    const current = await getFacts();
    const { data: items } = await supabase
      .from("collection_items")
      .select("data")
      .eq("site_id", siteId);
    const problems = taxonomyProblems(current, body.data, items ?? []);
    if (problems.length) {
      return NextResponse.json(
        { error: problems.map((p) => p.reason).join(" "), problems },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("facts")
      .update({ data: body.data, updated_at: new Date().toISOString() })
      .eq("site_id", siteId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    clearFactsCache();
  revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "page") {
    const { error } = await supabase
      .from("pages")
      .update({ data: body.data, published: true, updated_at: new Date().toISOString() })
      .eq("site_id", siteId)
      .eq("slug", body.slug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath(body.slug === "home" ? "/" : `/${body.slug}`);
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "collection-item") {
    const def = COLLECTIONS[body.collection];
    if (!def) return NextResponse.json({ error: "Onbekende collectie" }, { status: 400 });

    const missing = def.fields
      .filter((f) => f.required && !String(body.data?.[f.name] ?? "").trim())
      .map((f) => f.label);
    if (missing.length) {
      return NextResponse.json(
        { error: `Nog invullen: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const slug = def.slugFrom(body.data);
    const { error } = await supabase.from("collection_items").upsert(
      {
        site_id: siteId,
        collection: body.collection,
        slug,
        data: body.data,
        published: body.published ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "site_id,collection,slug" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // The item's own page, plus every listing it could appear on.
    revalidatePath(def.urlFor(body.data));
    clearFactsCache();
  revalidatePath("/", "layout");
    // The title too: the client cannot derive it, because titleFor stays
    // on the server — and it needs the brand names out of facts.
    const facts = await getFacts();
    return NextResponse.json({
      ok: true,
      slug,
      title: def.titleFor(body.data, labelsFrom(facts.brands?.items ?? [])),
    });
  }

  if (body.kind === "collection-item-delete") {
    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("site_id", siteId)
      .eq("collection", body.collection)
      .eq("slug", body.slug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    clearFactsCache();
  revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Onbekend type" }, { status: 400 });
}
