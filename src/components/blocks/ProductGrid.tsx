import { formatEuro, spreadByBrand } from "../../collections";
import { ProductCard } from "../ProductCard";
import { externalProps } from "../../links";
import type { BlockProps } from "../../types";

/** A grid of items from a collection. Like every other block it *references*
 *  content rather than containing it: the block stores a filter, never a copy
 *  of an item. A price changed in the item list is correct here the same
 *  second, on every page it appears.
 *
 *  Be honest about what it is showing. A small shop's online catalogue is
 *  almost always a selection rather than its stock; saying so is both true and
 *  an invitation to come in. */
export type ProductGridProps = {
  heading?: string;
  intro?: string;
  /** Filters, as field=value. Which fields are offered comes from the
   *  collection definition's `filterable` fields. */
  filters?: { field: string; value: string }[];
  collection?: string;
  limit?: number;
  columns?: number;
  showPrices?: boolean;
  emptyText?: string;
  linkLabel?: string;
  linkHref?: string;
  /** Alternating bands give a long page rhythm without adding section types. */
  background?: "default" | "tint";
  /** Show one item per brand before showing a second of any. A shop window
   *  with five of one brand side by side sells that brand; five different
   *  makers sells the shop. */
  variety?: boolean;
  /** Skip the first N. Lets a second row on the same page show different items
   *  from the row above it — otherwise both take "the first five" and repeat
   *  each other exactly. */
  offset?: number;
  /** Set by listing pages that supply their own page frame. */
  bare?: boolean;
  /** Legacy: filters as individual props, from before `filters` existed.
   *
   *  Kept because a shared engine deploys *before* anyone migrates the page
   *  data that feeds it. Code ships in seconds; a database migration is a
   *  separate, manual act. In the window between them a site renders with the
   *  old shape against the new component — and the failure is silent, because
   *  an unknown prop is simply ignored and every filtered row quietly stops
   *  filtering.
   *
   *  That happened on the first migration: two homepage rows showed the same
   *  items, and a women's row showed a men's brand. Nothing failed to build.
   *
   *  Removing these is a major version, and the release note must say
   *  "migrate your page data first". */
  dept?: string;
  category?: string;
  brand?: string;
};

/** Reads both shapes. `filters` wins where both are present. */
function activeFilters(props: {
  filters?: { field: string; value: string }[];
  dept?: string;
  category?: string;
  brand?: string;
}): { field: string; value: string }[] {
  if (props.filters?.length) return props.filters;
  return (["dept", "category", "brand"] as const)
    .filter((f) => props[f])
    .map((f) => ({ field: f, value: props[f] as string }));
}

export function ProductGrid({
  heading,
  intro,
  filters,
  collection,
  limit,
  columns = 5,
  showPrices = true,
  emptyText,
  linkLabel,
  linkHref,
  background = "default",
  variety = false,
  offset = 0,
  bare = false,
  dept,
  category,
  brand,
  catalogue = [],
}: BlockProps<ProductGridProps>) {
  let items = catalogue;
  if (collection) items = items.filter((i) => i.collection === collection);
  for (const f of activeFilters({ filters, dept, category, brand })) {
    if (f.field && f.value) items = items.filter((i) => i.data[f.field] === f.value);
  }
  if (variety) items = spreadByBrand(items);
  if (offset) items = items.slice(offset);
  if (limit) items = items.slice(0, limit);

  // Two across on a phone and up to five on a wide screen — the grid the
  // retail sector uses. Four columns inside a narrow page gives each item
  // about 230px, which reads as a placeholder rather than a product.
  const cols =
    columns === 2 ? "sm:grid-cols-2" :
    columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" :
    columns === 5 ? "sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" :
    "sm:grid-cols-3 lg:grid-cols-4";

  const body = (
    <>
      {heading && <h2 className="text-3xl font-semibold">{heading}</h2>}
      {intro && <p className="mt-3 max-w-2xl text-(--color-muted)">{intro}</p>}

      {items.length === 0 ? (
        <p className="mt-8 text-(--color-muted)">
          {emptyText ??
            "Hier staat op dit moment niets online. Kom gerust langs of bel ons — we hebben veel meer in de winkel dan op de site."}
        </p>
      ) : (
        <ul className={`grid grid-cols-2 gap-x-5 gap-y-8 ${cols} ${heading || intro ? "mt-8" : ""}`}>
          {items.map((item) => (
            <li key={item.id}>
              <ProductCard
                href={item.url}
                title={item.title}
                image={item.data.image}
                alt={item.title}
                price={
                  showPrices && typeof item.data.price === "number"
                    ? formatEuro(item.data.price)
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}

      {linkLabel && linkHref && (
        <p className="mt-10">
          <a href={linkHref} className="font-medium text-(--color-brand) underline" {...externalProps(linkHref)}>
            {linkLabel}
          </a>
        </p>
      )}
    </>
  );

  if (bare) return body;
  return (
    <section className={background === "tint" ? "bg-(--color-brand-tint)" : ""}>
      <div className="page py-14">{body}</div>
    </section>
  );
}
