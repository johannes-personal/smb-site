import type { BlockProps } from "../../types";
import { externalProps } from "../../links";

export type GalleryProps = {
  heading?: string;
  intro?: string;
  /** Captions matter more than count — they are what tells a visitor this is a
   *  real place. Alt text describes the photo, never the filename. */
  images: { src: string; alt: string; caption?: string }[];
  linkLabel?: string;
  linkHref?: string;
};

export function Gallery({ heading, intro, images, linkLabel, linkHref }: BlockProps<GalleryProps>) {
  return (
    <section className="page py-16">
      {heading && <h2 className="text-3xl font-semibold">{heading}</h2>}
      {intro && <p className="mt-3 text-(--color-muted)">{intro}</p>}
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {images?.map((img, i) => (
          <li key={i}>
            <img src={img.src} alt={img.alt} className="aspect-4/3 w-full rounded-(--radius-soft) object-cover" />
            {img.caption && <p className="mt-2 text-sm text-(--color-muted)">{img.caption}</p>}
          </li>
        ))}
      </ul>
      {linkHref && <a href={linkHref} className="mt-6 inline-block font-medium text-(--color-brand) underline" {...externalProps(linkHref)}>{linkLabel ?? "Alle foto's"}</a>}
    </section>
  );
}
