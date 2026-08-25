import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ fout?: string }>;
}) {
  if (await getUser()) redirect("/beheer");
  const { fout } = await searchParams;
  const uitleg =
    fout === "verlopen"
      ? "Die link werkte niet meer. Een inloglink is een kwartier geldig en kan maar één keer gebruikt worden — vraag hieronder een nieuwe aan."
      : fout
        ? "Er ging iets mis bij het inloggen. Vraag hieronder een nieuwe link aan."
        : null;

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold">Inloggen</h1>
      <p className="mt-3 text-(--color-muted)">
        Vul uw e-mailadres in. U krijgt een e-mail met een link waarmee u meteen bent
        ingelogd — u hoeft geen wachtwoord te onthouden.
      </p>
      {uitleg && (
        <p role="status" className="mt-6 rounded-(--radius-soft) bg-amber-50 p-4">
          {uitleg}
        </p>
      )}
      <LoginForm />
    </div>
  );
}
