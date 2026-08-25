import type { BlockProps } from "../../types";
import { externalProps } from "../../links";

export type CTABandProps = {
  heading: string;
  body?: string;
  label: string;
  /** Set usePhone to build the link from facts.nap.phone rather than typing a
   *  number that will one day be out of date. */
  usePhone?: boolean;
  href?: string;
};

export function CTABand({ heading, body, label, usePhone, href, facts }: BlockProps<CTABandProps>) {
  const target = usePhone ? `tel:${facts.nap.phone}` : href ?? "#";
  return (
    <section className="bg-(--color-brand) text-(--color-brand-ink)">
      <div className="page-narrow py-14 text-center">
        <h2 className="text-3xl font-semibold">{heading}</h2>
        {body && <p className="mt-3 opacity-95">{body}</p>}
        <a href={target} className="mt-7 inline-block rounded-(--radius-soft) bg-(--color-accent) px-7 py-3 font-medium text-(--color-ink)" {...externalProps(target)}>
          {label}
        </a>
      </div>
    </section>
  );
}
