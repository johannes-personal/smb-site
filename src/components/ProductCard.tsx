import { externalProps } from "../links";

/** One item tile. Split out of ProductGrid because the listing pages, the
 *  "more like this" strip and the grid block must not drift apart — a card
 *  that looks different on a category page than on the homepage is the usual
 *  way a catalogue starts to look untended.
 *
 *  Two deliberate details:
 *
 *  - `.product-plate` is white and multiplies the photo over it. The supplier
 *    photography is shot on white, so any tinted plate showed as a grey or
 *    brown band around the product.
 *  - `.zoomable` magnifies on hover, which is what people expect from a
 *    footwear site and is cheaper than a lightbox: no dialog, no focus trap,
 *    nothing to close. It is pointer-only and motion-safe, so it never fires
 *    on a phone. On the product page there is a bigger image anyway.
 */
export function ProductCard({
  href,
  title,
  image,
  alt,
  price,
}: {
  href: string;
  title: string;
  image?: string;
  alt: string;
  price?: string;
}) {
  return (
    <a href={href} className="group block" {...externalProps(href)}>
      <div className="product-plate zoomable overflow-hidden rounded-(--radius-soft) border border-black/10 group-hover:border-(--color-brand)">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={alt}
          loading="lazy"
          className="aspect-square w-full object-contain"
        />
      </div>
      <p className="mt-3 leading-snug font-medium group-hover:text-(--color-brand)">{title}</p>
      {price && <p className="text-sm text-(--color-muted)">{price}</p>}
    </a>
  );
}
