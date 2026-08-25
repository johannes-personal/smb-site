import type { BlockProps } from "../../types";

/** The masthead of an inner page: a coloured band with the eyebrow, the h1 and
 *  a lead sentence.
 *
 *  It exists because pages that opened straight into a TextSection had two
 *  problems at once. Visually they began with grey prose against white and
 *  looked unfinished; structurally they had no `h1` at all, because TextSection
 *  headings are `h2` — so the page told a screen reader and a search engine
 *  nothing about what it was. One block fixes both. */
export type PageIntroProps = {
  eyebrow?: string;
  heading: string;
  lead?: string;
  background?: "tint" | "brand";
};

export function PageIntro({ eyebrow, heading, lead, background = "tint" }: BlockProps<PageIntroProps>) {
  const dark = background === "brand";
  return (
    <section
      className={dark ? "bg-(--color-brand-dark) text-white" : "bg-(--color-brand-tint)"}
    >
      <div className="page py-12 sm:py-16">
        {eyebrow && (
          <p
            className={`mb-3 text-sm tracking-[0.14em] uppercase ${dark ? "opacity-80" : "text-(--color-muted)"}`}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className={`max-w-4xl text-4xl font-semibold sm:text-5xl ${dark ? "" : "text-(--color-brand-dark)"}`}
        >
          {heading}
        </h1>
        {lead && (
          <p
            className={`mt-5 max-w-2xl text-lg leading-relaxed ${dark ? "opacity-95" : "text-(--color-muted)"}`}
          >
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
