import { getFacts } from "@/lib/facts";
import { getItems } from "@/lib/collections";
import { itemsOf, usageCounts, type TaxonomyKind } from "@smb-site/engine";
import { TaxonomyEditor, type Lists, type Row } from "./TaxonomyEditor";

export const dynamic = "force-dynamic";

/** The lists behind the product form's dropdowns. Separate from "Mijn
 *  gegevens" because it needs the product counts, and because it is the screen
 *  an owner visits twice a year rather than twice a week. */
export default async function TaxonomiePage() {
  const [facts, products] = await Promise.all([
    getFacts(),
    getItems({ collection: "producten" }),
  ]);

  const build = (kind: TaxonomyKind): Row[] => {
    const counts = usageCounts(products, kind);
    return itemsOf(facts, kind).map((i) => ({
      id: i.id,
      label: i.label,
      count: counts[i.id] ?? 0,
    }));
  };

  const initial: Lists = {
    departments: build("departments"),
    categories: build("categories"),
    brands: build("brands"),
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Soorten en merken</h1>
      <p className="mt-3 text-(--color-muted)">
        Dit zijn de keuzelijsten bij een product. Wat u hier toevoegt, kunt u meteen bij een
        artikel kiezen, en het verschijnt vanzelf in het zoekmenu naast de artikelen.
      </p>
      <p className="mt-3 text-sm text-(--color-muted)">
        De naam mag u altijd aanpassen — die verandert dan overal op de site. Het stukje
        achter de schuine streep is het webadres; dat ligt vast zodra er artikelen in staan,
        zodat bestaande links blijven werken.
      </p>
      <p className="mt-4 text-sm">
        <a href="/beheer" className="underline">
          ← Terug naar Mijn gegevens
        </a>
      </p>
      {/* Only ids, labels and counts cross into the client component — the
          full facts document holds things this screen has no business
          rewriting. */}
      <TaxonomyEditor initial={initial} />
    </div>
  );
}
