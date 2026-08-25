import type { BlockProps } from "../../types";

/** Use the questions the business is actually asked on the phone every week.
 *  Invented FAQs read as filler and answer nobody. */
export type FAQProps = { heading?: string; items: { question: string; answer: string }[] };

export function FAQ({ heading, items }: BlockProps<FAQProps>) {
  return (
    <section className="page-narrow py-16">
      {heading && <h2 className="text-3xl font-semibold">{heading}</h2>}
      <div className="mt-8 divide-y divide-black/10">
        {items?.map((item, i) => (
          <details key={i} className="py-4">
            <summary className="cursor-pointer font-medium">{item.question}</summary>
            <p className="mt-3 text-(--color-muted)">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
