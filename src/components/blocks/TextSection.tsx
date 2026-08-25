import type { BlockProps } from "../../types";

/** Constrained prose. Deliberately not a free HTML field — an owner who can
 *  paste arbitrary markup can break the design, which is the thing the
 *  component registry exists to prevent. */
export type TextSectionProps = {
  heading?: string;
  body: string;
  width?: "narrow" | "wide";
  background?: "default" | "alt";
};

export function TextSection({ heading, body, width = "narrow", background = "default" }: BlockProps<TextSectionProps>) {
  return (
    <section className={background === "alt" ? "bg-(--color-surface-alt)" : ""}>
      {/* Prose stays narrow even when the rest of the site is wide: a line of
          text 1400px across is unreadable, whatever the container is set to. */}
      <div className={`py-16 ${width === "narrow" ? "page-narrow" : "page-prose"}`}>
        {heading && <h2 className="text-3xl font-semibold">{heading}</h2>}
        {body?.split("\n\n").map((p, i) => (
          <p key={i} className="mt-4 leading-relaxed text-(--color-muted)">{p}</p>
        ))}
      </div>
    </section>
  );
}
