import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import { SignOut } from "./SignOut";

export const dynamic = "force-dynamic";

/**
 * Everything under /beheer requires a signed-in user.
 *
 * The API routes check this too, and both checks are load-bearing: without the
 * one here, the facts form, the product list and the page canvas are readable
 * by anyone who guesses the URL. Writes would fail, but the shop's data would
 * already be on screen.
 */
export default async function BeheerLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/inloggen");

  return (
    <>
      <div className="border-b border-black/10 bg-(--color-surface-alt)">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm">
          <nav className="flex flex-wrap gap-x-5 gap-y-1">
            <a href="/beheer" className="underline">Mijn gegevens</a>
            <a href="/beheer/paginas/home" className="underline">Pagina's</a>
            <a href="/" className="underline">Bekijk de site</a>
          </nav>
          <span className="text-(--color-muted)">
            {user.email} · <SignOut />
          </span>
        </div>
      </div>
      {children}
    </>
  );
}
