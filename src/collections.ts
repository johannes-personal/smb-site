// The collection model: how a repeating content type — products, dishes,
// events — is described, and the pure functions over it.
//
// Types, definitions and pure helpers only. Fetching items belongs to the host
// application, which owns the database. That seam is why `resolveItem` takes
// its labels as an argument rather than reaching for them: the engine never
// knows where anything is stored.

import type { ResolvedItem } from "./types";


export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "number" | "image" | "select" | "textarea" | "price";
  required?: boolean;
  options?: { label: string; value: string }[];
  /** Shown under the field in the owner form. Say what good looks like. */
  help?: string;
  /** Kept when the owner clicks "save and add another". Items arrive in
   *  batches that share these — the department and brand of a delivery, the
   *  category of a week's news. */
  sticky?: boolean;
  /** Offered as a filter on the ProductGrid block, and as a facet in the
   *  catalogue sidebar. Fields with few distinct values (department, category,
   *  brand); never a free-text field. */
  filterable?: boolean;
  /** Names the facts list this field's options come from. The taxonomy editor
   *  reads this to know which lists exist and which item field each governs,
   *  so adding a fourth axis needs no change there. */
  taxonomy?: "departments" | "categories" | "brands";
};

export type CollectionDef = {
  id: string;
  label: string;
  labelSingular: string;
  /** One sentence at the top of the owner's screen: what happens to an item
   *  once it is saved. */
  ownerIntro: string;
  /** How a new item's slug is built from its data. */
  slugFrom: (data: Record<string, unknown>) => string;
  /** Where an item lives on the site. */
  urlFor: (data: Record<string, unknown>) => string;
  /** How an item titles itself in listings and in the owner's list.
   *
   *  `labels` maps an id stored on the item (a brand, a category) to the
   *  display name that lives in facts. It is passed in on every call rather
   *  than read from module state: a cache populated by whichever page happened
   *  to render first is empty on every other code path, and on a serverless
   *  runtime it differs between instances of the same deployment. That is
   *  exactly what went wrong here — every public product read "waldlaufer
   *  4883" instead of "Waldlaufer 4883", because only the owner screen ever
   *  filled the map. */
  titleFor: (data: Record<string, unknown>, labels?: Record<string, string>) => string;

  fields: FieldDef[];
};

/**
 * The part of a definition that may cross into a client component.
 *
 * `CollectionDef` holds functions (`slugFrom`, `urlFor`, `titleFor`), and React
 * cannot serialise a function across the server/client boundary — passing the
 * whole def to a client component throws at render time, not at build time, so
 * it typechecks and deploys and then 500s on the one page nobody could reach
 * until auth existed. Keep the functions on the server; send this instead.
 */
export type ClientCollectionDef = {
  id: string;
  label: string;
  labelSingular: string;
  ownerIntro: string;
  fields: FieldDef[];
};

export function toClientDef(def: CollectionDef): ClientCollectionDef {
  const { id, label, labelSingular, ownerIntro, fields } = def;
  return { id, label, labelSingular, ownerIntro, fields };
}

/** An item prepared for the owner's screen: its title resolved on the server,
 *  because `titleFor` cannot travel to the browser. */
export type OwnerItem = {
  slug: string;
  title: string;
  data: Record<string, any>;
  updated_at: string;
};

export function toOwnerItems(
  def: CollectionDef,
  items: CollectionItem[],
  labels?: Record<string, string>
): OwnerItem[] {
  return items.map((i) => ({
    slug: i.slug,
    title: def.titleFor(i.data, labels),
    data: i.data,
    updated_at: i.updated_at,
  }));
}

export type CollectionItem = {
  id: string;
  collection: string;
  slug: string;
  data: Record<string, any>;
  published: boolean;
  updated_at: string;
};

/**
 * Producten — deliberately the same six fields the old site had.
 *
 * The shop's current loop is: photograph the shoe, upload it, type the model
 * number and the price. That is fast and they have kept it up since at least
 * 2024. Colour and a short name would both help this shop enormously in search
 * — right now "2701" is the only thing Google can index about a shoe — but
 * adding them is the owners' decision to make in the first meeting, not a
 * change to spring on them. See docs/eerste-gesprek.md.
 */
export const PRODUCTEN: CollectionDef = {
  id: "producten",
  label: "Producten",
  labelSingular: "product",
  ownerIntro:
    "Schoenen die u hier toevoegt, staan meteen op de site — op de merkpagina, bij de soort en op de homepage bij de nieuwste. U hoeft verder niets aan te passen.",
  slugFrom: (d) => `${d.dept}-${d.category}-${d.brand}-${d.model}`,
  urlFor: (d) => `/${d.dept}/${d.category}/${d.brand}/${d.model}`,
  titleFor: (d, labels) =>
    `${brandLabel(String(d.brand ?? ""), labels)} ${d.model ?? ""}`.trim(),
  fields: [
    { sticky: true, name: "dept", label: "Afdeling", type: "select", required: true, filterable: true, taxonomy: "departments", options: [] },
    { sticky: true, name: "category", label: "Soort", type: "select", required: true, filterable: true, taxonomy: "categories", options: [] },
    { sticky: true, name: "brand", label: "Merk", type: "select", required: true, filterable: true, taxonomy: "brands", options: [] },
    {
      name: "model",
      label: "Modelnummer",
      type: "text",
      required: true,
      help: "Het nummer zoals het op de doos staat, bijvoorbeeld 2701.",
    },
    {
      name: "image",
      label: "Foto",
      type: "image",
      required: true,
      help: "Eén foto van de schoen, het liefst op een witte ondergrond.",
    },
    {
      name: "price",
      label: "Prijs",
      type: "price",
      required: true,
      help: "In euro's, bijvoorbeeld 159,95.",
    },
  ],
};

export const COLLECTIONS: Record<string, CollectionDef> = {
  producten: PRODUCTEN,
};

/** The taxonomy lives in facts — one list, edited in /beheer, feeding both the
 *  product form and the site. Call this before rendering a form or reading
 *  `def.fields`; it is the only thing that puts options on the three select
 *  fields.
 *
 *  It mutates the shared definition, which is fine on a server that renders one
 *  request at a time from one facts document — but it is *not* a source of
 *  truth. Nothing that renders a name may read it; `titleFor` takes its labels
 *  as an argument for exactly that reason. */
export function setTaxonomyOptions(facts: {
  departments?: { items: { id: string; label: string }[] };
  categories?: { items: { id: string; label: string }[] };
  brands?: { items: { id: string; label: string }[] };
}) {
  const set = (field: string, items?: { id: string; label: string }[]) => {
    const target = PRODUCTEN.fields.find((f) => f.name === field);
    if (target) target.options = (items ?? []).map((i) => ({ label: i.label, value: i.id }));
  };
  set("dept", facts.departments?.items ?? [{ id: "dames", label: "Dames" }, { id: "heren", label: "Heren" }]);
  set("category", facts.categories?.items);
  set("brand", facts.brands?.items);
}

/** Falls back to Title Case of the id rather than the bare id, so a brand
 *  missing from facts still reads as a name and not as a slug. */
function brandLabel(id: string, labels?: Record<string, string>) {
  const known = labels?.[id];
  if (known) return known;
  return id
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/** The id -> display name map `titleFor` wants, built from a facts brand list. */
export function labelsFrom(items: { id: string; label: string }[] = []): Record<string, string> {
  return Object.fromEntries(items.map((b) => [b.id, b.label]));
}

/** One item, resolved for rendering: its data plus the title and URL derived
 *  from the collection definition, so blocks never re-derive either. */
export function resolveItem(
  item: CollectionItem,
  labels?: Record<string, string>
): ResolvedItem {
  const def = COLLECTIONS[item.collection];
  return {
    id: item.id,
    collection: item.collection,
    slug: item.slug,
    title: def.titleFor(item.data, labels),
    url: def.urlFor(item.data),
    data: item.data,
  };
}

/** Reorders so the first pass takes one item per brand, the second pass a
 *  second of each, and so on — the order within a brand is preserved. */
export function spreadByBrand(items: ResolvedItem[]): ResolvedItem[] {
  const byBrand = new Map<string, ResolvedItem[]>();
  for (const item of items) {
    const brand = String(item.data.brand ?? "");
    const bucket = byBrand.get(brand);
    if (bucket) bucket.push(item);
    else byBrand.set(brand, [item]);
  }
  const buckets = [...byBrand.values()];
  const out: ResolvedItem[] = [];
  for (let round = 0; out.length < items.length; round++) {
    for (const bucket of buckets) {
      if (bucket[round]) out.push(bucket[round]);
    }
  }
  return out;
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);
}
