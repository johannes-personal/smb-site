// Loading facts. The *model* — every type, and the pure helpers over it —
// lives in @smb-site/engine; this file is the half that knows where they are
// stored, which is the half that differs per project.
//
// Re-exported so the rest of the app imports facts from one place.

import { createServerClient } from "./supabase";
import type { Facts } from "@smb-site/engine";

export type {
  Facts,
  HoursFact,
  HoursRule,
  Season,
  PricesFact,
  PriceTier,
  NapFact,
  ServiceItem,
  BrandItem,
  TaxonomyItem,
  Predicate,
  NavItem,
} from "@smb-site/engine";
export { pickTiers, formatPrice } from "@smb-site/engine";

let cache: { at: number; value: Facts } | null = null;

/** Drops the cache after a write, so the owner sees their own edit rather than
 *  the previous 30 seconds of it. Every route that writes facts must call this
 *  — `revalidatePath` clears Next's cache, not this one. */
export function clearFactsCache() {
  cache = null;
}

export async function getFacts(): Promise<Facts> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("facts")
    .select("data")
    .eq("site_id", process.env.NEXT_PUBLIC_SITE_ID ?? "default")
    .single();
  if (error) throw error;
  cache = { at: Date.now(), value: data.data as Facts };
  return cache.value;
}
