// Loading collection items. The *model* — CollectionDef, the field types, the
// pure helpers — lives in @smb-site/engine. This file is the half that knows
// where items are stored, which is the half that differs per project.
//
// Re-exported so the rest of the app imports collections from one place and
// does not have to know which side of the seam a given name lives on.

import { createServerClient } from "./supabase";
import { getFacts } from "./facts";
import {
  COLLECTIONS,
  labelsFrom,
  resolveItem,
  type CollectionItem,
  type ResolvedItem,
} from "@smb-site/engine";

export {
  COLLECTIONS,
  PRODUCTEN,
  formatEuro,
  labelsFrom,
  resolveItem,
  setTaxonomyOptions,
  spreadByBrand,
  toClientDef,
  toOwnerItems,
} from "@smb-site/engine";
export type {
  ClientCollectionDef,
  CollectionDef,
  CollectionItem,
  FieldDef,
  OwnerItem,
  ResolvedItem,
} from "@smb-site/engine";

/** How a listing asks for items. */
export type ItemQuery = {
  collection: string;
  /** Matched against the item's jsonb, e.g. { dept: "dames", brand: "gabor" }. */
  where?: Record<string, string>;
  limit?: number;
  /** Newest first by default — what "laatste toevoegingen" wants. */
  order?: "newest" | "oldest";
};

export async function getItems(query: ItemQuery): Promise<CollectionItem[]> {
  const supabase = createServerClient();
  let q = supabase
    .from("collection_items")
    .select("id, collection, slug, data, published, updated_at")
    .eq("site_id", process.env.NEXT_PUBLIC_SITE_ID ?? "default")
    .eq("collection", query.collection)
    .eq("published", true);

  for (const [key, value] of Object.entries(query.where ?? {})) {
    q = q.eq(`data->>${key}`, value);
  }
  q = q.order("created_at", { ascending: query.order === "oldest" });
  if (query.limit) q = q.limit(query.limit);

  const { data, error } = await q;
  if (error) throw new Error(`Kon ${query.collection} niet laden: ${error.message}`);
  return (data ?? []) as CollectionItem[];
}

/** One item by slug, for its own page. */
export async function getItem(
  collection: string,
  slug: string
): Promise<CollectionItem | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("collection_items")
    .select("id, collection, slug, data, published, updated_at")
    .eq("site_id", process.env.NEXT_PUBLIC_SITE_ID ?? "default")
    .eq("collection", collection)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return (data as CollectionItem) ?? null;
}

/** Counts per value of one field — "how many Gabor shoes are there" — so a
 *  brand or category with nothing in it can be hidden rather than leading a
 *  visitor to an empty page. */
export async function countsBy(
  collection: string,
  field: string,
  where: Record<string, string> = {}
): Promise<Record<string, number>> {
  const items = await getItems({ collection, where });
  const out: Record<string, number> = {};
  for (const item of items) {
    const key = String(item.data[field] ?? "");
    if (key) out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

/** Every published item of every collection, resolved. Blocks filter this in
 *  memory rather than each running its own query — Puck renders synchronously,
 *  so a block cannot fetch for itself.
 *
 *  Reads facts for the display names: an item's title is "Gabor 2701" and the
 *  "Gabor" half is a fact. Deriving it here rather than from module state is
 *  what keeps every title right on every route.
 *
 *  Fine while the collections total in the low thousands, which covers a small
 *  business catalogue. Past that this wants a query per block. */
export async function getCatalogue(): Promise<ResolvedItem[]> {
  const [perCollection, facts] = await Promise.all([
    Promise.all(Object.keys(COLLECTIONS).map((collection) => getItems({ collection }))),
    getFacts(),
  ]);
  const labels = labelsFrom(facts.brands?.items ?? []);
  return perCollection.flat().map((item) => resolveItem(item, labels));
}
