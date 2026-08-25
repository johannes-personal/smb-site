import { getFacts } from "@/lib/facts";
import { FactsForm } from "./FactsForm";
import { SeedButton } from "./SeedButton";

/**
 * "Mijn gegevens" — the surface the owner actually uses. Hours, prices, phone,
 * address. Impossible to break, and for most businesses this is 100% of what
 * they will ever change.
 *
 * The canvas lives at /beheer/paginas and is for the rare structural change.
 */
// Never prerendered: this route needs Supabase and a signed-in session, so
// building it at compile time both fails and would be wrong if it succeeded.
export const dynamic = "force-dynamic";

export default async function BeheerPage() {
  const facts = await getFacts();
  return (
    <div className="page-narrow py-12">
      <h1 className="text-3xl font-semibold">Mijn gegevens</h1>
      <p className="mt-3 text-(--color-muted)">
        Wat u hier aanpast, verandert overal op de site vanzelf mee.
      </p>
      <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        <a href="/beheer/producten" className="underline">Producten toevoegen of aanpassen →</a>
        <a href="/beheer/taxonomie" className="underline">Soorten en merken →</a>
        <a href="/beheer/paginas/home" className="underline">Pagina's aanpassen →</a>
      </nav>
      <FactsForm initial={facts} />
      <SeedButton />
    </div>
  );
}
