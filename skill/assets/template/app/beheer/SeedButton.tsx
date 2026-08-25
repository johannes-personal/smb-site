"use client";

import { useState } from "react";

/**
 * Setup actions, run from the browser rather than a laptop.
 *
 * Loads content/*.json from the deployment into the database.
 *
 * Deliberately a button rather than a command: setting this site up should not
 * require a checkout, a Node install and a secret key on somebody's laptop.
 * Everything here can be done from a browser.
 *
 * Safe to press twice — every row upserts on its natural key.
 */
export function SeedButton() {
  return <LoadContent />;
}

function LoadContent() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function run() {
    setState("busy");
    setMessage("");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Laden mislukte");
      const counts = Object.entries(json.geladen ?? {})
        .map(([k, v]) => `${v} ${k}`)
        .join(", ");
      setState("done");
      setMessage(`Geladen: ${counts}.`);
    } catch (e) {
      setState("error");
      setMessage((e as Error).message);
    }
  }

  return (
    <div className="mt-10 rounded-(--radius-soft) border border-black/10 p-4">
      <h2 className="font-semibold">Gegevens uit het project laden</h2>
      <p className="mt-1 text-sm text-(--color-muted)">
        Zet de teksten, openingstijden en producten uit het project in de database. Dit is
        alleen nodig bij het inrichten van de site, of om terug te gaan naar de laatst
        opgeleverde versie. U kunt hier geen gegevens mee kwijtraken.
      </p>
      <button
        onClick={run}
        disabled={state === "busy"}
        className="mt-3 rounded-(--radius-soft) border border-(--color-brand) px-4 py-2 text-sm font-medium text-(--color-brand) disabled:opacity-40"
      >
        {state === "busy" ? "Bezig…" : "Laden"}
      </button>
      {message && (
        <p
          role="status"
          className={`mt-3 rounded p-3 text-sm ${
            state === "error" ? "bg-amber-50" : "bg-green-50"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
