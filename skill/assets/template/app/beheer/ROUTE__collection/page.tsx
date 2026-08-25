import { notFound } from "next/navigation";
import { getFacts } from "@/lib/facts";
import {
  COLLECTIONS,
  getItems,
  setTaxonomyOptions,
  labelsFrom,
  toClientDef,
  toOwnerItems,
} from "@/lib/collections";
import { CollectionManager } from "@/components/CollectionManager";

export const dynamic = "force-dynamic";

/** The third owner surface, alongside "Mijn gegevens" and "Pagina's". One
 *  screen per collection, driven entirely by the definition in
 *  lib/collections.ts — adding a collection does not mean writing a screen. */
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const def = COLLECTIONS[collection];
  if (!def) notFound();

  const facts = await getFacts();
  // Afdeling, soort and merk options all come from facts, so there is one list
  // per axis rather than one in the form and another in the router.
  setTaxonomyOptions(facts);

  const items = await getItems({ collection });

  return (
    <div className="page py-12">
      <h1 className="text-3xl font-semibold">{def.label}</h1>
      <p className="mt-3 max-w-2xl text-(--color-muted)">{def.ownerIntro}</p>
      <p className="mt-4 text-sm">
        <a href="/beheer" className="underline">
          ← Terug naar Mijn gegevens
        </a>
      </p>
      {/* Only the serialisable half crosses into the client component —
          CollectionDef's functions cannot be sent over that boundary. */}
      <CollectionManager def={toClientDef(def)} initial={toOwnerItems(def, items, labelsFrom(facts.brands?.items ?? []))} />
    </div>
  );
}
