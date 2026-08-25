import type { BlockProps } from "../../types";
import { externalProps } from "../../links";

/** Real, attributable reviews only. Invented or unattributed quotes are both
 *  dishonest and, for review platforms, usually a terms violation. */
export type TestimonialsProps = {
  heading?: string;
  items: { quote: string; author: string; source?: string; sourceUrl?: string }[];
};

export function Testimonials({ heading, items }: BlockProps<TestimonialsProps>) {
  return (
    <section className="bg-(--color-surface-alt)">
      <div className="page py-16">
        {heading && <h2 className="text-3xl font-semibold">{heading}</h2>}
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items?.map((t, i) => (
            <li key={i} className="rounded-(--radius-soft) bg-(--color-surface) p-6">
              <blockquote className="leading-relaxed">{t.quote}</blockquote>
              <p className="mt-4 text-sm font-medium">{t.author}</p>
              {t.source && (
                <p className="text-sm text-(--color-muted)">
                  {t.sourceUrl ? <a href={t.sourceUrl} className="underline" {...externalProps(t.sourceUrl)}>{t.source}</a> : t.source}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
