"use client";

import { useState } from "react";
import { slugify } from "@smb-site/engine";

/** The lists behind the three dropdowns on the product form — afdeling, soort
 *  and merk — edited by the owner instead of by a developer.
 *
 *  Two rules the interface has to teach without a manual:
 *
 *  1. **The name is free; the web address is not.** A soort's id is in the
 *     address of every product filed under it, so it is written once, from the
 *     first name given, and then shown greyed out. Renaming "Booties" to
 *     "Enkellaarsjes" changes every heading on the site and breaks nothing.
 *  2. **Nothing in use can be removed.** The count beside each row is what
 *     makes that obvious before the owner tries. `/api/publish` enforces it as
 *     well, because a browser tab can be stale.
 *
 *  Deliberately not offered: reordering by drag. The list order is the sidebar
 *  order, and up/down buttons are usable with one hand on a phone, which drag
 *  is not.
 */

export type Row = { id: string; label: string; count: number; isNew?: boolean };
export type Lists = Record<"departments" | "categories" | "brands", Row[]>;

const HEADING: Record<keyof Lists, string> = {
  departments: "Afdelingen",
  categories: "Soorten",
  brands: "Merken",
};

const BLURB: Record<keyof Lists, string> = {
  departments:
    "De hoofdindeling van de winkel. Deze staat in het menu en in elke productlink.",
  categories:
    "Wat voor artikel het is. Kiest u er hier een bij, dan kunt u die meteen bij een product kiezen.",
  brands: "De merken die u voert. Deze verschijnen op de merkenpagina en in het zoekmenu.",
};

const SINGULAR: Record<keyof Lists, string> = {
  departments: "afdeling",
  categories: "soort",
  brands: "merk",
};

export function TaxonomyEditor({ initial }: { initial: Lists }) {
  const [lists, setLists] = useState<Lists>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  function update(kind: keyof Lists, rows: Row[]) {
    setLists({ ...lists, [kind]: rows });
    setStatus("idle");
  }

  function add(kind: keyof Lists) {
    update(kind, [...lists[kind], { id: "", label: "", count: 0, isNew: true }]);
  }

  function rename(kind: keyof Lists, index: number, label: string) {
    const rows = [...lists[kind]];
    const row = rows[index];
    // The id is written once, from the first name, and never again.
    const taken = rows.filter((_, n) => n !== index).map((r) => r.id);
    const id = row.isNew ? uniqueFrom(label, taken) : row.id;
    rows[index] = { ...row, label, id };
    update(kind, rows);
  }

  function move(kind: keyof Lists, index: number, by: -1 | 1) {
    const rows = [...lists[kind]];
    const to = index + by;
    if (to < 0 || to >= rows.length) return;
    [rows[index], rows[to]] = [rows[to], rows[index]];
    update(kind, rows);
  }

  function remove(kind: keyof Lists, index: number) {
    update(
      kind,
      lists[kind].filter((_, n) => n !== index)
    );
  }

  async function save() {
    setStatus("saving");
    setMessage("");
    const res = await fetch("/api/taxonomie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        departments: strip(lists.departments),
        categories: strip(lists.categories),
        brands: strip(lists.brands),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus("saved");
      setMessage("Opgeslagen. De lijsten staan meteen op de site en in het productformulier.");
    } else {
      setStatus("error");
      setMessage(json.error ?? "Opslaan is niet gelukt. Probeer het nog eens.");
    }
  }

  const incomplete = (Object.keys(lists) as (keyof Lists)[]).some((k) =>
    lists[k].some((r) => !r.label.trim())
  );

  return (
    <div className="mt-10 space-y-12">
      {(Object.keys(HEADING) as (keyof Lists)[]).map((kind) => (
        <section key={kind}>
          <h2 className="text-xl font-semibold">{HEADING[kind]}</h2>
          <p className="mt-1 text-sm text-(--color-muted)">{BLURB[kind]}</p>

          <ul className="mt-4 space-y-2">
            {lists[kind].map((row, i) => (
              <li
                key={`${kind}-${i}`}
                className="flex flex-wrap items-center gap-3 rounded border border-black/10 p-3"
              >
                <input
                  className="min-w-48 flex-1 rounded border border-black/20 p-2"
                  value={row.label}
                  placeholder={`Naam van de ${SINGULAR[kind]}`}
                  aria-label={`Naam van de ${SINGULAR[kind]}`}
                  onChange={(e) => rename(kind, i, e.target.value)}
                />
                <code className="text-xs text-(--color-muted)" title="Dit deel staat in de webadressen en verandert niet meer">
                  /{row.id || slugify(row.label) || "…"}
                </code>
                <span className="text-xs text-(--color-muted) tabular-nums">
                  {row.count} {row.count === 1 ? "artikel" : "artikelen"}
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Naar boven"
                    className="rounded border border-black/20 px-2 py-1 text-sm disabled:opacity-30"
                    disabled={i === 0}
                    onClick={() => move(kind, i, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Naar beneden"
                    className="rounded border border-black/20 px-2 py-1 text-sm disabled:opacity-30"
                    disabled={i === lists[kind].length - 1}
                    onClick={() => move(kind, i, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="rounded border border-black/20 px-3 py-1 text-sm disabled:opacity-30"
                    disabled={row.count > 0}
                    title={
                      row.count > 0
                        ? `Kan niet weg: er ${row.count === 1 ? "staat" : "staan"} nog ${row.count} ${row.count === 1 ? "artikel" : "artikelen"} in.`
                        : undefined
                    }
                    onClick={() => remove(kind, i)}
                  >
                    Verwijderen
                  </button>
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="mt-3 rounded border border-black/20 px-3 py-2 text-sm"
            onClick={() => add(kind)}
          >
            {SINGULAR[kind].charAt(0).toUpperCase() + SINGULAR[kind].slice(1)} toevoegen
          </button>
        </section>
      ))}

      <div className="sticky bottom-0 border-t border-black/10 bg-white py-4">
        <button
          onClick={save}
          disabled={incomplete || status === "saving"}
          className="rounded bg-(--color-brand) px-6 py-3 font-medium text-white disabled:opacity-40"
        >
          {status === "saving" ? "Bezig…" : "Opslaan"}
        </button>
        {incomplete && (
          <span className="ml-3 text-sm text-(--color-muted)">
            Geef eerst elke regel een naam.
          </span>
        )}
        {message && (
          <span className={`ml-3 text-sm ${status === "error" ? "text-red-700" : ""}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

function uniqueFrom(label: string, taken: string[]): string {
  const base = slugify(label);
  if (!base) return "";
  if (!taken.includes(base)) return base;
  for (let n = 2; ; n++) {
    if (!taken.includes(`${base}-${n}`)) return `${base}-${n}`;
  }
}

/** Only id and label reach the server; counts are derived, never stored. */
function strip(rows: Row[]) {
  return rows
    .filter((r) => r.label.trim() && r.id)
    .map((r) => ({ id: r.id, label: r.label.trim() }));
}
