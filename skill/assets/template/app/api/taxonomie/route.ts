import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase";
import { getUser } from "@/lib/supabase-server";
import { clearFactsCache, getFacts, type Facts, type TaxonomyItem } from "@/lib/facts";
import { taxonomyProblems, type TaxonomyKind } from "@smb-site/engine";

export const dynamic = "force-dynamic";

/**
 * Saves the three taxonomy lists.
 *
 * A dedicated route rather than `kind: "facts"` on /api/publish, because the
 * editor holds three lists and nothing else. Sending a whole facts document
 * back from a screen that only owns part of it is how one form silently
 * reverts another's changes — the owner edits the phone number in "Mijn
 * gegevens", then saves a new soort here, and the phone number goes back.
 * So the client sends only what it owns and the server merges.
 *
 * Everything the editor does not know about — a brand's `logo`, the `note`
 * explaining where a list came from, `departments` scoping — is carried over
 * from the stored entry rather than dropped.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const body = (await request.json()) as Partial<
    Record<TaxonomyKind, { id: string; label: string }[]>
  >;

  const siteId = process.env.NEXT_PUBLIC_SITE_ID ?? "default";
  const current = await getFacts();
  const supabase = createAdminClient();

  const merged: Facts = { ...current };

  for (const kind of ["departments", "categories", "brands"] as TaxonomyKind[]) {
    const incoming = body[kind];
    if (!incoming) continue;

    const seen = new Set<string>();
    for (const row of incoming) {
      if (!row.id || !row.label?.trim()) {
        return NextResponse.json(
          { error: "Elke regel heeft een naam nodig." },
          { status: 400 }
        );
      }
      if (seen.has(row.id)) {
        return NextResponse.json(
          { error: `"${row.label}" staat er twee keer in.` },
          { status: 400 }
        );
      }
      seen.add(row.id);
    }

    const existing = new Map(
      ((current[kind]?.items ?? []) as TaxonomyItem[]).map((i) => [i.id, i])
    );
    const items: TaxonomyItem[] = incoming.map((row) => ({
      ...(existing.get(row.id) ?? {}),
      id: row.id,
      label: row.label.trim(),
    }));

    merged[kind] = { ...(current[kind] ?? {}), items };
  }

  // The ids are in every product URL. Removing one that is still in use would
  // 404 every page under it, so it is refused here as well as in the editor —
  // a browser tab can be stale, and this route is reachable directly.
  const { data: products } = await supabase
    .from("collection_items")
    .select("data")
    .eq("site_id", siteId);
  const problems = taxonomyProblems(current, merged, products ?? []);
  if (problems.length) {
    return NextResponse.json(
      { error: problems.map((p) => p.reason).join(" "), problems },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("facts")
    .update({ data: merged, updated_at: new Date().toISOString() })
    .eq("site_id", siteId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Every catalogue page reads the taxonomy — for its labels, its sidebar and
  // whether a path resolves at all.
  clearFactsCache();
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
