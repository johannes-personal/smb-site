import type { BlockProps } from "../../types";
import { externalProps } from "../../links";

export type CardGridProps = {
  heading?: string;
  intro?: string;
  /** When set, cards are read from facts.services instead of being typed here —
   *  preferred, so the service list lives in one place. */
  fromServices?: boolean;
  serviceIds?: string[];
  cards?: { title: string; text?: string; image?: string; imageAlt?: string; href?: string }[];
  columns?: 2 | 3 | 4;
};

export function CardGrid({ heading, intro, fromServices, serviceIds, cards, columns = 3, facts }: BlockProps<CardGridProps>) {
  const resolved = fromServices
    ? facts.services.items
        .filter((s) => !serviceIds?.length || serviceIds.includes(s.id))
        .map((s) => ({ title: s.label, text: s.description, image: s.image, imageAlt: s.label, href: undefined }))
    : cards ?? [];

  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];

  return (
    <section className="page py-16">
      {heading && <h2 className="text-3xl font-semibold">{heading}</h2>}
      {intro && <p className="mt-3 max-w-2xl text-(--color-muted)">{intro}</p>}
      <ul className={`mt-8 grid gap-6 ${cols}`}>
        {resolved.map((c, i) => (
          <li key={i} className="overflow-hidden rounded-(--radius-soft) bg-(--color-surface-alt)">
            {c.image && <img src={c.image} alt={c.imageAlt ?? ""} className="aspect-4/3 w-full object-cover" />}
            <div className="p-5">
              <h3 className="font-semibold">{c.title}</h3>
              {c.text && <p className="mt-2 text-sm text-(--color-muted)">{c.text}</p>}
              {c.href && <a href={c.href} className="mt-3 inline-block text-sm font-medium text-(--color-brand) underline" {...externalProps(c.href)}>Bekijken</a>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
