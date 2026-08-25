import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COLLECTIONS, labelsFrom, toClientDef, toOwnerItems } from "@/lib/collections";

// The server/client boundary is invisible to TypeScript and to `next build`.
// A function passed into a client component typechecks, compiles, deploys —
// and then throws at render time on that one page. If the page is behind auth,
// nobody finds out until somebody logs in.
//
// That happened here: the owner's product screen 500'd because the page handed
// a CollectionDef, functions and all, to a client component.

/** Everything React can send to a client component survives this round trip. */
function isSerialisable(value: unknown): boolean {
  try {
    return JSON.parse(JSON.stringify(value)) !== undefined;
  } catch {
    return false;
  }
}

function hasFunction(value: unknown, path = ""): string | null {
  if (typeof value === "function") return path || "(root)";
  if (value && typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) {
      const found = hasFunction(inner, path ? `${path}.${key}` : key);
      if (found) return found;
    }
  }
  return null;
}

describe("what crosses into a client component", () => {
  it("sends no functions in a collection definition", () => {
    for (const [id, def] of Object.entries(COLLECTIONS)) {
      // The full definition legitimately holds functions...
      expect(hasFunction(def), `${id} should have functions server-side`).not.toBeNull();
      // ...and the client half must not.
      const client = toClientDef(def);
      expect(hasFunction(client), `toClientDef(${id}) leaks a function`).toBeNull();
      expect(isSerialisable(client)).toBe(true);
    }
  });

  it("sends items with their titles already resolved", () => {
    for (const [id, def] of Object.entries(COLLECTIONS)) {
      const items = toOwnerItems(def, [
        {
          id: "x",
          collection: id,
          slug: "x",
          data: { dept: "dames", category: "schoenen", brand: "gabor", model: "2701" },
          published: true,
          updated_at: new Date().toISOString(),
        },
      ]);
      expect(items[0].title).toBeTruthy();
      expect(hasFunction(items)).toBeNull();
      expect(isSerialisable(items)).toBe(true);
    }
  });
});

describe("client components", () => {
  // A structural check rather than a runtime one: any component marked
  // "use client" must not import the server-only definitions, because the
  // functions on them cannot cross the boundary.
  const roots = ["components", "app"];

  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...walk(full));
      else if (/\.tsx?$/.test(entry)) out.push(full);
    }
    return out;
  }

  const clientFiles = roots
    .flatMap((r) => walk(r))
    .filter((f) => readFileSync(f, "utf8").trimStart().startsWith('"use client"'));

  it("finds the client components", () => {
    expect(clientFiles.length).toBeGreaterThan(2);
  });

  it("never pulls a server-only database client into the browser bundle", () => {
    // `lib/taxonomy.ts` is imported by the taxonomy editor for `slugify`. It
    // references `Facts`, which lives in a module that constructs a Supabase
    // server client — so that import has to stay type-only, or the secret-key
    // client gets bundled for the browser. Type imports are erased; a value
    // import would not be.
    for (const file of clientFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} imports a server client`).not.toMatch(
        /import[^;]*\b(createServerClient|createAdminClient)\b/
      );
    }
  });

  it("never imports a type that carries functions", () => {
    for (const file of clientFiles) {
      const source = readFileSync(file, "utf8");
      // CollectionDef and CollectionItem are the server-side shapes. A client
      // component wanting them almost certainly means a boundary violation.
      expect(source, `${file} imports CollectionDef`).not.toMatch(
        /import[^;]*\bCollectionDef\b[^;]*from/
      );
    }
  });
});

describe("item titles", () => {
  // The bug: titleFor read a module-level brand map that only the owner screen
  // ever populated, so every public item title rendered the raw id —
  // "waldlaufer 4883" instead of "Waldlaufer 4883". It typechecked, it built,
  // and it was only visible by looking at the deployed page.
  const facts: { brands?: { items: { id: string; label: string }[] } } = JSON.parse(
    readFileSync("content/facts.json", "utf8")
  );
  const labels = labelsFrom(facts.brands?.items ?? []);
  const item = { dept: "dames", category: "schoenen", brand: "waldlaufer", model: "4883" };

  it("uses the display name from facts", () => {
    expect(COLLECTIONS.producten.titleFor(item, labels)).toBe("Waldlaufer 4883");
  });

  it("never renders a bare slug when facts are missing", () => {
    // No labels at all — a title must still read as a name, not an id.
    expect(COLLECTIONS.producten.titleFor({ ...item, brand: "josef-seibel" })).toBe(
      "Josef Seibel 4883"
    );
  });

  it("resolves every brand in facts to something other than its id", () => {
    for (const brand of facts.brands?.items ?? []) {
      const title = COLLECTIONS.producten.titleFor({ ...item, brand: brand.id }, labels);
      expect(title, `brand "${brand.id}"`).toContain(brand.label);
    }
  });
});
