"use client";

import { useState } from "react";
import type { Facts } from "@/lib/facts";

/**
 * Deliberately a plain form, not a canvas. The owner guide's most-used sections
 * map one-to-one onto the groups here.
 *
 * Extend this per project with the facts that site actually has — but keep the
 * shape: label, input, one-line explanation of where it shows up.
 */
export function FactsForm({ initial }: { initial: Facts }) {
  const [facts, setFacts] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setStatus("saving");
    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "facts", data: facts }),
    });
    setStatus(res.ok ? "saved" : "error");
  }

  const nap = facts.nap;

  return (
    <div className="mt-10 space-y-10">
      <section>
        <h2 className="text-xl font-semibold">Contactgegevens</h2>
        <p className="text-sm text-(--color-muted)">Staat in de kop, in de voettekst en op de contactpagina.</p>
        <label className="mt-4 block">
          <span className="block text-sm font-medium">Telefoonnummer (zoals het op de site staat)</span>
          <input
            className="mt-1 w-full rounded border border-black/20 p-2"
            value={nap.phoneDisplay}
            onChange={(e) => setFacts({ ...facts, nap: { ...nap, phoneDisplay: e.target.value } })}
          />
        </label>
        <label className="mt-4 block">
          <span className="block text-sm font-medium">E-mailadres</span>
          <input
            className="mt-1 w-full rounded border border-black/20 p-2"
            value={nap.email ?? ""}
            onChange={(e) => setFacts({ ...facts, nap: { ...nap, email: e.target.value } })}
          />
        </label>
      </section>

      {/* Only for businesses that price the business rather than the item. A
          shop's prices belong to its products, so this section is absent. */}
      {facts.prices && (
        <section>
          <h2 className="text-xl font-semibold">Prijzen</h2>
          <p className="text-sm text-(--color-muted)">
            U past een prijs op één plek aan. Hij verandert dan overal op de site.
          </p>
          {facts.prices.externalSource && (
            <p className="mt-3 rounded bg-amber-50 p-3 text-sm">
              Let op: {facts.prices.externalSource.warning}
            </p>
          )}
          {facts.prices.tiers.map((tier, i) => (
            <label key={tier.id} className="mt-4 block">
              <span className="block text-sm font-medium">{tier.label}</span>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-40 rounded border border-black/20 p-2"
                value={tier.amount}
                onChange={(e) => {
                  const prices = facts.prices!;
                  const tiers = [...prices.tiers];
                  tiers[i] = { ...tier, amount: Number(e.target.value) };
                  setFacts({ ...facts, prices: { ...prices, tiers } });
                }}
              />
            </label>
          ))}
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold">Openingstijden</h2>
        <p className="text-sm text-(--color-muted)">
          Uitzonderingen zijn losse dagen: een feestdag, een extra open dag, of een dag dat u dicht bent.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {(facts.hours.exceptions ?? []).map((e, i) => (
            <li key={i} className="rounded bg-(--color-surface-alt) p-3">
              {e.date} — {e.status === "closed" || !e.open ? "gesloten" : `${e.open}–${e.close}`}
              {e.reason ? ` (${e.reason})` : ""}
            </li>
          ))}
        </ul>
        <button
          className="mt-3 rounded border border-black/20 px-3 py-2 text-sm"
          onClick={() =>
            setFacts({
              ...facts,
              hours: {
                ...facts.hours,
                exceptions: [
                  ...(facts.hours.exceptions ?? []),
                  { date: new Date().toISOString().slice(0, 10), status: "closed", reason: "" },
                ],
              },
            })
          }
        >
          Uitzondering toevoegen
        </button>
      </section>

      <div className="sticky bottom-0 border-t border-black/10 bg-white py-4">
        <button onClick={save} className="rounded bg-(--color-brand) px-6 py-3 font-medium text-white">
          Opslaan
        </button>
        {status === "saved" && <span className="ml-3 text-sm">Opgeslagen. De site is bijgewerkt.</span>}
        {status === "error" && <span className="ml-3 text-sm">Opslaan is niet gelukt. Probeer het nog eens.</span>}
      </div>
    </div>
  );
}
