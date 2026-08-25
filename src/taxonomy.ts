// The catalogue's taxonomy — the departments, the kinds of thing and the
// makers — read from facts rather than from constants in the code.
//
// It started as two `as const` arrays in two files: the product form read one,
// the URL router read the other. That made adding a kind of shoe a code change
// and a deploy, which is exactly the thing this whole architecture exists to
// avoid; and two copies of the same list drift.
//
// The one rule that makes this safe: **an id is frozen once anything uses it.**
// The id is in every product URL — /dames/schoenen/gabor/2701 — so renaming it
// breaks links that are already in Google and in people's bookmarks. The label
// is free to change and never appears in a URL. The owner edits labels; ids are
// generated once, from the first label, and then left alone.

import type { Facts, TaxonomyItem } from "./facts";

/** Fallbacks for a site whose facts predate the taxonomy. Not a second source
 *  of truth: the moment facts carry a list, that list wins entirely. */
const FALLBACK_DEPTS: TaxonomyItem[] = [
  { id: "dames", label: "Dames" },
  { id: "heren", label: "Heren" },
];

export function departments(facts: Facts): TaxonomyItem[] {
  return facts.departments?.items?.length ? facts.departments.items : FALLBACK_DEPTS;
}

export function categories(facts: Facts): TaxonomyItem[] {
  return facts.categories?.items ?? [];
}

export function brands(facts: Facts): TaxonomyItem[] {
  return facts.brands?.items ?? [];
}

/** id -> label, for the places that render a name from a stored id. */
export function labelsOf(items: TaxonomyItem[]): Record<string, string> {
  return Object.fromEntries(items.map((i) => [i.id, i.label]));
}

/** The label for one id, falling back to a Title-Cased id so an entry missing
 *  from facts still reads as a name rather than as a slug. */
export function labelFor(items: TaxonomyItem[], id: string): string {
  const found = items.find((i) => i.id === id);
  if (found) return found.label;
  return id
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/** Options for a `select` field, in the order the owner arranged them. */
export function optionsOf(items: TaxonomyItem[]): { label: string; value: string }[] {
  return items.map((i) => ({ label: i.label, value: i.id }));
}

/** Builds a URL-safe id from a label. Used once, when an entry is created; an
 *  entry that already has an id keeps it forever. */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents: "café" -> "cafe"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A slug not already taken, so two kinds named the same do not collide. */
export function uniqueSlug(label: string, taken: string[]): string {
  const base = slugify(label) || "item";
  if (!taken.includes(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.includes(candidate)) return candidate;
  }
}

export type TaxonomyKind = "departments" | "categories" | "brands";

/** Which field on a product stores each kind. */
export const FIELD_FOR: Record<TaxonomyKind, string> = {
  departments: "dept",
  categories: "category",
  brands: "brand",
};

export const KIND_LABEL: Record<TaxonomyKind, string> = {
  departments: "Afdelingen",
  categories: "Soorten",
  brands: "Merken",
};

export function itemsOf(facts: Facts, kind: TaxonomyKind): TaxonomyItem[] {
  if (kind === "departments") return departments(facts);
  if (kind === "categories") return categories(facts);
  return brands(facts);
}

/** How many items use each id of a given kind. Drives the counts in the editor
 *  and the guard below. */
export function usageCounts(
  items: { data: Record<string, unknown> }[],
  kind: TaxonomyKind
): Record<string, number> {
  const field = FIELD_FOR[kind];
  const out: Record<string, number> = {};
  for (const item of items) {
    const value = String(item.data[field] ?? "");
    if (value) out[value] = (out[value] ?? 0) + 1;
  }
  return out;
}

export type TaxonomyProblem = { kind: TaxonomyKind; id: string; count: number; reason: string };

/** Refuses the two edits that would break live URLs.
 *
 *  Removing an entry orphans every item filed under it — the products stay in
 *  the database but their pages 404, because the router no longer recognises
 *  the segment. Renaming an id does the same and additionally breaks links
 *  already in Google and in people's bookmarks.
 *
 *  The editor explains both in the UI; this is the part that enforces it, so a
 *  stale browser tab or a direct API call cannot get round it. */
export function taxonomyProblems(
  before: Facts,
  after: Facts,
  items: { data: Record<string, unknown> }[]
): TaxonomyProblem[] {
  const problems: TaxonomyProblem[] = [];
  for (const kind of ["departments", "categories", "brands"] as TaxonomyKind[]) {
    const used = usageCounts(items, kind);
    const wasPresent = itemsOf(before, kind).map((i) => i.id);
    const stillPresent = new Set(itemsOf(after, kind).map((i) => i.id));
    for (const id of wasPresent) {
      if (stillPresent.has(id)) continue;
      const count = used[id] ?? 0;
      if (count > 0) {
        problems.push({
          kind,
          id,
          count,
          reason:
            `"${id}" wordt nog gebruikt door ${count} ${count === 1 ? "artikel" : "artikelen"}. ` +
            `Verplaats die eerst naar een andere ${kind === "brands" ? "merk" : "soort"}.`,
        });
      }
    }
  }
  return problems;
}
