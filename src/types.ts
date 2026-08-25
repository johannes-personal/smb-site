import type { Facts } from "./facts";

/** One item of a collection, resolved for rendering: its data plus the title
 *  and URL derived from the collection definition, so blocks never re-derive
 *  either. */
export type ResolvedItem = {
  id: string;
  collection: string;
  slug: string;
  title: string;
  url: string;
  data: Record<string, any>;
};

/** Every block receives the resolved facts. Blocks read from these rather than
 *  holding their own copies — that is what keeps one price in one place.
 *
 *  Blocks that show a collection receive it the same way, pre-resolved. Puck
 *  renders synchronously, so fetching inside a block is not an option; the
 *  route resolves the collection once and every block filters the same array.
 *  Fine while a collection is in the low thousands, which covers a small
 *  business catalogue — beyond that this needs a per-block query instead. */
export type BlockProps<P> = P & { facts: Facts; catalogue?: ResolvedItem[] };
