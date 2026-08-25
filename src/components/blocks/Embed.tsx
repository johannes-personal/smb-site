import type { BlockProps } from "../../types";
import { externalProps } from "../../links";

/** How an integration the business already has survives the rebuild.
 *  Reusing their existing booking or ticket widget is nearly always better
 *  than integrating its API — fewer accounts, fewer things to break. */
export type EmbedProps = {
  heading?: string;
  intro?: string;
  title: string;        // accessible name for the iframe — required
  src: string;
  ratio?: "16:9" | "4:3" | "1:1" | "tall";
  fallbackLabel?: string;
  fallbackHref?: string;
  /** Note for the owner guide: does this embed set cookies? */
  setsCookies?: boolean;
};

const RATIOS: Record<string, string> = {
  "16:9": "aspect-video", "4:3": "aspect-4/3", "1:1": "aspect-square", tall: "min-h-[900px]",
};

export function Embed({ heading, intro, title, src, ratio = "16:9", fallbackLabel, fallbackHref }: BlockProps<EmbedProps>) {
  return (
    <section className="page-narrow py-16">
      {heading && <h2 className="text-3xl font-semibold">{heading}</h2>}
      {intro && <p className="mt-3 text-(--color-muted)">{intro}</p>}
      <iframe
        src={src}
        title={title}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className={`mt-6 w-full rounded-(--radius-soft) border-0 ${RATIOS[ratio]}`}
      />
      {fallbackHref && (
        <p className="mt-3 text-sm">
          Werkt dit niet? <a href={fallbackHref} className="underline" {...externalProps(fallbackHref)}>{fallbackLabel ?? "Open in een nieuw venster"}</a>
        </p>
      )}
    </section>
  );
}
