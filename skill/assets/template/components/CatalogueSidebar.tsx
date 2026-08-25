import type { Facts } from "@/lib/facts";
import { departments, externalProps } from "@smb-site/engine";

/** The catalogue's own navigation, beside the goods rather than above them.
 *
 *  Chips across the top of the page were the previous attempt, and they failed
 *  in the way category chips usually do: they scroll away, so from the third
 *  row of products onward there is no way to narrow the search without going
 *  back up. A sticky sidebar keeps every route into the catalogue visible for
 *  the whole page, which is what the larger shops in this sector do.
 *
 *  Counts are computed from the catalogue, never maintained by hand, so a
 *  brand that sells out stops being offered instead of leading to an empty
 *  page. */

export type FacetGroup = {
  heading: string;
  items: { label: string; href: string; count: number; current?: boolean }[];
};

function Group({ group }: { group: FacetGroup }) {
  if (group.items.length === 0) return null;
  return (
    <div className="border-t border-black/10 pt-4 first:border-0 first:pt-0">
      <h2 className="text-xs font-semibold tracking-[0.12em] text-(--color-muted) uppercase">
        {group.heading}
      </h2>
      <ul className="mt-2">
        {group.items.map((i) => (
          <li key={i.href}>
            <a
              href={i.href}
              {...externalProps(i.href)}
              aria-current={i.current ? "page" : undefined}
              className={`flex items-baseline justify-between gap-3 rounded py-1.5 pr-2 pl-2 text-sm hover:bg-(--color-brand-tint) ${
                i.current ? "bg-(--color-brand-tint) font-semibold text-(--color-brand-dark)" : ""
              }`}
            >
              <span>{i.label}</span>
              <span className="text-xs text-(--color-muted) tabular-nums">{i.count}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CatalogueSidebar({
  facts,
  dept,
  groups,
}: {
  facts: Facts;
  dept?: string;
  groups: FacetGroup[];
}) {
  return (
    <aside aria-label="Zoeken in de collectie" className="lg:sticky lg:top-6 lg:self-start">
      <nav className="flex gap-2 pb-4">
        {departments(facts).map((d) => (
          <a
            key={d.id}
            href={`/${d.id}`}
            aria-current={d.id === dept ? "page" : undefined}
            className={`flex-1 rounded-(--radius-soft) px-4 py-2 text-center text-sm font-medium ${
              d.id === dept
                ? "bg-(--color-brand-dark) text-white"
                : "border border-black/10 text-(--color-brand-dark) hover:border-(--color-brand)"
            }`}
          >
            {d.label}
          </a>
        ))}
      </nav>
      <div className="space-y-4">
        {groups.map((g) => (
          <Group key={g.heading} group={g} />
        ))}
      </div>
      <p className="mt-6 border-t border-black/10 pt-4 text-sm text-(--color-muted)">
        Niet gevonden wat u zoekt? Bel ons op{" "}
        <a href={`tel:${facts.nap.phone}`} className="font-medium text-(--color-brand) underline">
          {facts.nap.phoneDisplay}
        </a>{" "}
        — in de winkel staat veel meer dan op de site.
      </p>
    </aside>
  );
}
