import type { BlockProps } from "../../types";
import { externalProps } from "../../links";

export type HeroProps = {
  eyebrow?: string;
  heading: string;
  body?: string;
  image?: string;
  imageAlt?: string;
  /** "overlay" needs a tall, high-resolution photograph. "beside" works with a
   *  wide crop, which is all some businesses have — see the imagery note in
   *  the design brief. */
  layout?: "overlay" | "beside";
  /** Reads the number from facts.nap rather than letting someone type it into
   *  the page, where it would drift the day the shop changes provider. */
  usePhone?: boolean;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function Hero({
  eyebrow,
  heading,
  body,
  image,
  imageAlt,
  layout = "overlay",
  usePhone,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  facts,
}: BlockProps<HeroProps>) {
  const primary = usePhone
    ? { href: `tel:${facts.nap.phone}`, label: primaryLabel || `Bel ${facts.nap.phoneDisplay}` }
    : primaryLabel && primaryHref
      ? { href: primaryHref, label: primaryLabel }
      : null;

  const buttons = (
    <div className="mt-8 flex flex-wrap gap-3">
      {primary && (
        <a
          href={primary.href}
          {...externalProps(primary.href)}
          className="rounded-(--radius-soft) bg-(--color-accent) px-6 py-3 font-medium text-white"
        >
          {primary.label}
        </a>
      )}
      {secondaryLabel && secondaryHref && (
        <a
          href={secondaryHref}
          {...externalProps(secondaryHref)}
          className={`rounded-(--radius-soft) border px-6 py-3 font-medium ${
            layout === "beside" ? "border-(--color-brand) text-(--color-brand)" : "border-white/70"
          }`}
        >
          {secondaryLabel}
        </a>
      )}
    </div>
  );

  if (layout === "beside") {
    return (
      <section className="page grid items-center gap-12 py-16 md:grid-cols-2">
        <div>
          {eyebrow && (
            <p className="mb-3 text-sm tracking-widest text-(--color-muted) uppercase">{eyebrow}</p>
          )}
          <h1 className="text-4xl font-semibold sm:text-5xl">{heading}</h1>
          {body && <p className="mt-5 text-lg leading-relaxed text-(--color-muted)">{body}</p>}
          {buttons}
        </div>
        {image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={image}
            alt={imageAlt ?? ""}
            className="aspect-4/3 w-full rounded-(--radius-soft) object-cover"
          />
        )}
      </section>
    );
  }

  return (
    <section className="relative isolate overflow-hidden">
      {image && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={image}
          alt={imageAlt ?? ""}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/55" aria-hidden />
      <div className="page relative py-24 text-white sm:py-32">
        {eyebrow && <p className="mb-3 text-sm tracking-widest uppercase opacity-90">{eyebrow}</p>}
        <h1 className="text-4xl font-semibold sm:text-5xl">{heading}</h1>
        {body && <p className="mt-5 max-w-2xl text-lg leading-relaxed opacity-95">{body}</p>}
        {buttons}
      </div>
    </section>
  );
}
