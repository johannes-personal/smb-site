import { formatPrice, pickTiers } from "../../facts";
import type { BlockProps } from "../../types";
import { externalProps } from "../../links";

/** Prices are never typed into a page. They are read from facts.prices, so a
 *  change reaches every page at once and cannot silently diverge. */
export type PriceTableProps = {
  heading?: string;
  tierIds?: string[];
  showPackages?: boolean;
  note?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function PriceTable({ heading, tierIds, showPackages, note, ctaLabel, ctaHref, facts }: BlockProps<PriceTableProps>) {
  const { prices } = facts;
  // Sectors whose prices belong to individual items rather than to the business
  // (a retailer prices the shoe, not the shop) have no prices fact at all.
  // Render nothing rather than an empty table.
  if (!prices) return null;
  const tiers = pickTiers(prices, tierIds);

  return (
    <section className="page-narrow py-16">
      {heading && <h2 className="text-3xl font-semibold">{heading}</h2>}
      <dl className="mt-8 divide-y divide-black/10">
        {tiers.map((t) => (
          <div key={t.id} className="flex items-baseline justify-between gap-6 py-4">
            <dt>
              <span className="font-medium">{t.label}</span>
              {t.note && <span className="block text-sm text-(--color-muted)">{t.note}</span>}
            </dt>
            <dd className="text-lg font-semibold">{formatPrice(t.amount, prices.currency)}</dd>
          </div>
        ))}
        {showPackages && prices.packages?.map((p) => (
          <div key={p.id} className="flex items-baseline justify-between gap-6 py-4">
            <dt>
              <span className="font-medium">{p.label}</span>
              {p.includes && <span className="block text-sm text-(--color-muted)">{p.includes.join(" · ")}</span>}
            </dt>
            <dd className="text-lg font-semibold">{formatPrice(p.amount, prices.currency)}</dd>
          </div>
        ))}
      </dl>
      {prices.groupDiscounts?.map((g, i) => (
        <p key={i} className="mt-4 text-sm text-(--color-muted)">
          Vanaf {g.from} personen: {g.discountPercent}% korting{g.note ? ` (${g.note})` : ""}
        </p>
      ))}
      {note && <p className="mt-4 text-sm text-(--color-muted)">{note}</p>}
      {prices.vatIncluded && <p className="mt-2 text-sm text-(--color-muted)">Alle prijzen zijn inclusief btw.</p>}
      {ctaLabel && ctaHref && (
        <a href={ctaHref} className="mt-8 inline-block rounded-(--radius-soft) bg-(--color-brand) px-6 py-3 font-medium text-(--color-brand-ink)" {...externalProps(ctaHref)}>{ctaLabel}</a>
      )}
    </section>
  );
}
