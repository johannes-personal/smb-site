import { describe, expect, it } from "vitest";
import type { Facts } from "../src/facts";
import {
  categories,
  departments,
  labelFor,
  slugify,
  taxonomyProblems,
  uniqueSlug,
  usageCounts,
} from "../src/taxonomy";

// The taxonomy used to be two `as const` arrays in two files: the product form
// read one, the URL router read the other. Adding a kind of shoe meant a code
// change and a deploy, and the two copies could disagree. These tests hold the
// line on the properties that make it safe to hand to the owner instead.

/** Synthetic facts. The engine has no content of its own — checking that a
 *  project's items are covered by that project's taxonomy is the project's
 *  test, and lives in the host application. */
const facts: Facts = {
  hours: { timezone: "Europe/Amsterdam", seasons: [] },
  nap: {
    legalName: "Voorbeeld",
    address: { street: "Straat 1", postalCode: "1234 AB", city: "Plaats", country: "NL" },
    phone: "+31600000000",
    phoneDisplay: "06 00 00 00 00",
  },
  services: { items: [] },
  socials: [],
  meta: { siteName: "Voorbeeld", language: "nl" },
  departments: { items: [{ id: "dames", label: "Dames" }, { id: "heren", label: "Heren" }] },
  categories: {
    items: [
      { id: "schoenen", label: "Schoenen" },
      { id: "laarzen", label: "Laarzen" },
      { id: "sandalen-slippers", label: "Sandalen en slippers" },
    ],
  },
  brands: { items: [{ id: "gabor", label: "Gabor" }, { id: "ara", label: "Ara" }] },
};

const product = (dept: string, category: string, brand: string) => ({
  data: { dept, category, brand },
});

describe("slugs", () => {
  it("makes a URL-safe id from a name", () => {
    expect(slugify("Sandalen en slippers")).toBe("sandalen-en-slippers");
    expect(slugify("Rieker R-Evolution")).toBe("rieker-r-evolution");
    expect(slugify("  Booties  ")).toBe("booties");
  });

  it("strips accents rather than dropping the letter", () => {
    // "Suède" must not become "sude".
    expect(slugify("Suède")).toBe("suede");
    expect(slugify("Café")).toBe("cafe");
  });

  it("never collides with an id already taken", () => {
    expect(uniqueSlug("Schoenen", ["schoenen"])).toBe("schoenen-2");
    expect(uniqueSlug("Schoenen", ["schoenen", "schoenen-2"])).toBe("schoenen-3");
    expect(uniqueSlug("Schoenen", [])).toBe("schoenen");
  });
});

describe("labels", () => {
  it("reads names out of facts", () => {
    expect(labelFor(categories(facts), "sandalen-slippers")).toBe("Sandalen en slippers");
    expect(labelFor(departments(facts), "dames")).toBe("Dames");
  });

  it("falls back to a name, never a bare slug", () => {
    // The same rule as product titles: a fallback that is obviously a
    // placeholder gets noticed; one that is merely slightly wrong ships.
    expect(labelFor([], "josef-seibel")).toBe("Josef Seibel");
  });
});

describe("what the owner may and may not do", () => {
  const items = [
    product("dames", "schoenen", "gabor"),
    product("dames", "schoenen", "ara"),
    product("dames", "laarzen", "gabor"),
  ];

  const withCategories = (ids: string[]): Facts => ({
    ...facts,
    categories: { items: ids.map((id) => ({ id, label: id })) },
  });

  it("counts what uses each entry", () => {
    expect(usageCounts(items, "categories")).toEqual({ schoenen: 2, laarzen: 1 });
    expect(usageCounts(items, "brands")).toEqual({ gabor: 2, ara: 1 });
  });

  it("allows adding a soort", () => {
    const before = withCategories(["schoenen", "laarzen"]);
    const after = withCategories(["schoenen", "laarzen", "sneakers"]);
    expect(taxonomyProblems(before, after, items)).toEqual([]);
  });

  it("allows renaming, because the label is not in the URL", () => {
    const before = withCategories(["schoenen", "laarzen"]);
    const after: Facts = {
      ...facts,
      categories: {
        items: [
          { id: "schoenen", label: "Nette schoenen" },
          { id: "laarzen", label: "Laarzen" },
        ],
      },
    };
    expect(taxonomyProblems(before, after, items)).toEqual([]);
  });

  it("allows reordering", () => {
    const before = withCategories(["schoenen", "laarzen"]);
    const after = withCategories(["laarzen", "schoenen"]);
    expect(taxonomyProblems(before, after, items)).toEqual([]);
  });

  it("allows removing an entry nothing uses", () => {
    const before = withCategories(["schoenen", "laarzen", "pantoffels"]);
    const after = withCategories(["schoenen", "laarzen"]);
    expect(taxonomyProblems(before, after, items)).toEqual([]);
  });

  it("refuses to remove one that is still in use", () => {
    // Removing it would not delete the products — it would 404 every page
    // under it, which is worse, because nothing looks wrong in the database.
    const before = withCategories(["schoenen", "laarzen"]);
    const after = withCategories(["schoenen"]);
    const problems = taxonomyProblems(before, after, items);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ kind: "categories", id: "laarzen", count: 1 });
    expect(problems[0].reason).toContain("1 artikel");
  });

  it("refuses an id change on an entry in use, which is a removal in disguise", () => {
    const before = withCategories(["schoenen", "laarzen"]);
    const after = withCategories(["schoenen", "enkellaarsjes"]);
    const problems = taxonomyProblems(before, after, items);
    expect(problems.map((p) => p.id)).toEqual(["laarzen"]);
  });

  it("catches it across every axis, not just categories", () => {
    const before = facts;
    const after: Facts = { ...facts, brands: { items: [] } };
    const problems = taxonomyProblems(before, after, items);
    expect(problems.map((p) => p.id).sort()).toEqual(["ara", "gabor"]);
  });
});
