import type { BlockProps } from "../../types";
import { externalProps } from "../../links";

export type FeatureRowProps = {
  eyebrow?: string;
  heading: string;
  body?: string;
  points?: { icon?: string; title: string; text?: string }[];
  image?: string;
  imageAlt?: string;
  imageSide?: "left" | "right";
  linkLabel?: string;
  linkHref?: string;
};

export function FeatureRow({ eyebrow, heading, body, points, image, imageAlt, imageSide = "right", linkLabel, linkHref }: BlockProps<FeatureRowProps>) {
  return (
    <section className="page grid items-center gap-12 py-16 md:grid-cols-2">
      <div className={imageSide === "left" ? "md:order-2" : ""}>
        {eyebrow && <p className="mb-2 text-sm uppercase tracking-widest text-(--color-brand)">{eyebrow}</p>}
        <h2 className="text-3xl font-semibold">{heading}</h2>
        {body && <p className="mt-4 leading-relaxed text-(--color-muted)">{body}</p>}
        {points && (
          <ul className="mt-6 space-y-4">
            {points.map((p, i) => (
              <li key={i}>
                <span className="font-semibold">{p.icon ? `${p.icon} ` : ""}{p.title}</span>
                {p.text && <span className="mt-1 block text-sm text-(--color-muted)">{p.text}</span>}
              </li>
            ))}
          </ul>
        )}
        {linkLabel && linkHref && (
          <a href={linkHref} className="mt-6 inline-block font-medium text-(--color-brand) underline" {...externalProps(linkHref)}>{linkLabel}</a>
        )}
      </div>
      {image && (
        <img src={image} alt={imageAlt ?? ""} className="aspect-4/3 w-full rounded-(--radius-soft) object-cover" />
      )}
    </section>
  );
}
