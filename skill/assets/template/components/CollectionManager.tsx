"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { ClientCollectionDef, OwnerItem } from "@/lib/collections";

/**
 * One screen for any collection, driven by its definition. Adding a collection
 * means describing its fields, not writing another form.
 *
 * The shape matters more than the code. Where a business already has a working
 * loop for adding items, mirror it field for field: the form should take the
 * same number of keystrokes it takes them today, or they will stop using it.
 *
 * "Opslaan en nog een toevoegen" keeps the fields marked `sticky` and clears
 * the rest. Items usually arrive in batches that share most of their values —
 * twenty pairs of one brand, not twenty different ones.
 */
export function CollectionManager({
  def,
  initial,
}: {
  // Deliberately the serialisable half of the definition. The functions on
  // CollectionDef cannot cross into a client component; titles arrive already
  // resolved on each item.
  def: ClientCollectionDef;
  initial: OwnerItem[];
}) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    if (!q) return sorted.slice(0, 60);
    return sorted.filter((i) => i.title.toLowerCase().includes(q)).slice(0, 60);
  }, [items, filter]);

  function set(name: string, value: any) {
    setDraft((d) => ({ ...d, [name]: value }));
  }

  async function uploadImage(file: File) {
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
      const path = `${def.id}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from("site-media").upload(path, file);
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      set("image", data.publicUrl);
      setMessage({ kind: "ok", text: "Foto geüpload." });
    } catch (e) {
      setMessage({ kind: "error", text: `Foto uploaden mislukte: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  async function save(andAnother: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "collection-item", collection: def.id, data: draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Opslaan mislukte");

      // The title comes back from the server, which owns titleFor.
      const title: string = json.title ?? json.slug;
      setItems((prev) => [
        { slug: json.slug, title, data: draft, updated_at: new Date().toISOString() },
        ...prev.filter((i) => i.slug !== json.slug),
      ]);
      setMessage({ kind: "ok", text: `${title} is opgeslagen en staat online.` });
      setEditingSlug(null);
      // Keep the sticky fields: items arrive in batches that share them.
      setDraft(
        andAnother
          ? Object.fromEntries(
              def.fields
                .filter((f) => f.sticky)
                .map((f) => [f.name, draft[f.name]])
                .filter(([, v]) => v !== undefined)
            )
          : {}
      );
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function remove(slug: string, title: string) {
    if (!confirm(`${title} van de site halen? Dit kan niet ongedaan worden gemaakt.`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "collection-item-delete", collection: def.id, slug }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Verwijderen mislukte");
      setItems((prev) => prev.filter((i) => i.slug !== slug));
      setMessage({ kind: "ok", text: `${title} is van de site gehaald.` });
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const complete = def.fields.every((f) => !f.required || String(draft[f.name] ?? "").trim());

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[24rem_1fr]">
      <section>
        <h2 className="text-xl font-semibold">
          {editingSlug ? "Product aanpassen" : `Nieuw ${def.labelSingular}`}
        </h2>

        {def.fields.map((field) => (
          <label key={field.name} className="mt-4 block">
            <span className="block text-sm font-medium">
              {field.label}
              {field.required && <span aria-hidden="true"> *</span>}
            </span>

            {field.type === "select" ? (
              <select
                className="mt-1 w-full rounded border border-black/20 p-2"
                value={draft[field.name] ?? ""}
                onChange={(e) => set(field.name, e.target.value)}
              >
                <option value="">— kies —</option>
                {field.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : field.type === "image" ? (
              <div className="mt-1">
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                />
                {draft.image && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={draft.image}
                    alt="Voorbeeld van de geüploade foto"
                    className="mt-2 h-32 rounded border border-black/10 object-contain"
                  />
                )}
              </div>
            ) : field.type === "price" ? (
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                className="mt-1 w-40 rounded border border-black/20 p-2"
                value={draft[field.name] ?? ""}
                onChange={(e) => set(field.name, Number(e.target.value))}
              />
            ) : (
              <input
                className="mt-1 w-full rounded border border-black/20 p-2"
                value={draft[field.name] ?? ""}
                onChange={(e) => set(field.name, e.target.value)}
              />
            )}

            {field.help && (
              <span className="mt-1 block text-sm text-(--color-muted)">{field.help}</span>
            )}
          </label>
        ))}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            disabled={busy || !complete}
            onClick={() => save(false)}
            className="rounded-(--radius-soft) bg-(--color-brand) px-5 py-2.5 font-medium text-(--color-brand-ink) disabled:opacity-40"
          >
            Opslaan
          </button>
          <button
            disabled={busy || !complete}
            onClick={() => save(true)}
            className="rounded-(--radius-soft) border border-(--color-brand) px-5 py-2.5 font-medium text-(--color-brand) disabled:opacity-40"
          >
            Opslaan en nog een toevoegen
          </button>
          {editingSlug && (
            <button
              onClick={() => {
                setEditingSlug(null);
                setDraft({});
              }}
              className="px-3 py-2.5 underline"
            >
              Annuleren
            </button>
          )}
        </div>

        {message && (
          <p
            role="status"
            className={`mt-4 rounded p-3 text-sm ${
              message.kind === "ok" ? "bg-green-50" : "bg-amber-50"
            }`}
          >
            {message.text}
          </p>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold">
            {items.length} {def.label.toLowerCase()} online
          </h2>
          <input
            className="rounded border border-black/20 p-2"
            placeholder="Zoek op merk of nummer"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <p className="mt-2 text-sm text-(--color-muted)">
          De nieuwste staan bovenaan. Er worden er 60 tegelijk getoond — zoek hierboven om
          een bepaalde schoen te vinden.
        </p>

        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {visible.map((item) => (
            <li key={item.slug} className="rounded-(--radius-soft) border border-black/10 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.data.image}
                alt=""
                className="h-28 w-full rounded object-contain"
              />
              <p className="mt-2 text-sm font-medium">{item.title}</p>
              <p className="text-sm text-(--color-muted)">
                {typeof item.data.price === "number"
                  ? new Intl.NumberFormat("nl-NL", {
                      style: "currency",
                      currency: "EUR",
                    }).format(item.data.price)
                  : "geen prijs"}
              </p>
              <div className="mt-2 flex gap-3 text-sm">
                <button
                  className="underline"
                  onClick={() => {
                    setDraft(item.data);
                    setEditingSlug(item.slug);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Aanpassen
                </button>
                <button
                  className="underline"
                  onClick={() => remove(item.slug, item.title)}
                >
                  Weghalen
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
