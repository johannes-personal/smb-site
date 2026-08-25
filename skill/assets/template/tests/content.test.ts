import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Facts } from "@/lib/facts";
import { buildConfig } from "@smb-site/engine";

// Content is data, so it can be wrong in ways TypeScript cannot see: a price
// off by a factor of a hundred, a brand that exists in one file and not
// another, a block referencing a component nobody wrote. These are the checks
// that catch that class of fault, and they run on every push.

const facts: Facts = JSON.parse(readFileSync("content/facts.json", "utf8"));
const allPages: Record<string, any> = JSON.parse(readFileSync("content/pages.json", "utf8"));
// Keys beginning with "_" are editorial notes in the JSON, not pages.
const pages: Record<string, { title: string; data: { content: { type: string; props: any }[] } }> =
  Object.fromEntries(Object.entries(allPages).filter(([k, v]) => !k.startsWith("_") && v?.data));
// The registry moved into @smb-site/engine. Asking the package directly is
// better than reading a file: it survives the engine reorganising itself, and
// it fails loudly if a project pins a version without a block it uses.
const registry = Object.keys(buildConfig(facts as any).components);

describe("facts", () => {
  it("carries the identity trio local search depends on", () => {
    expect(facts.nap.legalName).toBeTruthy();
    expect(facts.nap.address.street).toBeTruthy();
    expect(facts.nap.address.city).toBeTruthy();
  });

  it("stores the phone in E.164 so tel: links work on a phone", () => {
    expect(facts.nap.phone).toMatch(/^\+\d{8,}$/);
    expect(facts.nap.phoneDisplay).toBeTruthy();
  });

  it("states which days it is closed rather than omitting them", () => {
    // An omitted day reads as an oversight and sends someone to a locked door.
    if (facts.hours.mode !== "appointment") {
      const named = new Set([
        ...facts.hours.seasons.flatMap((s) =>
          s.rules.flatMap((r) => (Array.isArray(r.days) ? r.days : [r.days]))
        ),
        ...(facts.hours.closed ?? []).flatMap((c) => c.days),
      ]);
      const spelled = [...named].join(",");
      for (const day of ["ma", "di", "wo", "do", "vr", "za", "zo"]) {
        expect(spelled, `day "${day}" is neither opened nor explicitly closed`).toContain(day);
      }
    }
  });

  it("records where each fact came from", () => {
    // Phase 2 requires provenance. Without it, nobody at handover can tell a
    // confirmed fact from an inherited guess.
    expect(facts._provenance).toBeTruthy();
  });
});

describe("pages", () => {
  it("only uses blocks that exist in the registry", () => {
    // A page built from a component nobody wrote is a page the owner cannot
    // edit — the exact failure this architecture exists to prevent.
    for (const [slug, page] of Object.entries(pages)) {
      for (const block of page.data.content) {
        expect(registry, `page "${slug}" uses block "${block.type}"`).toContain(
          block.type
        );
      }
    }
  });

  it("never hard-codes the phone number into a page", () => {
    // It belongs in facts, referenced. A copy in page data drifts silently the
    // day the business changes provider.
    for (const [slug, page] of Object.entries(pages)) {
      const blob = JSON.stringify(page.data);
      expect(blob, `page "${slug}"`).not.toContain(facts.nap.phone);
    }
  });

  it("describes every image for someone who cannot see it", () => {
    for (const [slug, page] of Object.entries(pages)) {
      for (const block of page.data.content) {
        if (block.props?.image) {
          expect(block.props.imageAlt, `${slug}/${block.type}`).toBeTruthy();
        }
        for (const image of block.props?.images ?? []) {
          expect(image.alt, `${slug}/${block.type}`).toBeTruthy();
        }
      }
    }
  });

  it("has a homepage", () => {
    expect(pages.home).toBeTruthy();
  });

  it("gives every page exactly one h1, first", () => {
    // Hero and PageIntro are the two blocks that render an h1. A page with
    // none opens on a level-2 heading and tells a search engine nothing about
    // itself; a page with two is ambiguous. Easy to get wrong: a page that
    // starts with a TextSection has no h1 at all.
    const carriesH1 = new Set(["Hero", "PageIntro"]);
    for (const [slug, page] of Object.entries(pages)) {
      const found = page.data.content.filter((b) => carriesH1.has(b.type));
      expect(found.length, `page "${slug}" has ${found.length} h1 blocks`).toBe(1);
      expect(found[0], `page "${slug}" does not open with its h1`).toBe(
        page.data.content[0]
      );
    }
  });
});

// Only runs where the project has a collection. See references/07-collections.md.
const COLLECTIONS_FILE = "content/collections.json";
describe.runIf(existsSync(COLLECTIONS_FILE))("collections", () => {
  const collections: Record<string, { slug: string; data: any }[]> = existsSync(COLLECTIONS_FILE)
    ? JSON.parse(readFileSync(COLLECTIONS_FILE, "utf8"))
    : {};

  it("has no duplicate slugs", () => {
    // The slug is the item's identity; a collision silently overwrites an item
    // on seed.
    for (const [name, items] of Object.entries(collections)) {
      const slugs = items.map((i) => i.slug);
      expect(new Set(slugs).size, `collection "${name}"`).toBe(slugs.length);
    }
  });

  it("keeps every number within a plausible range", () => {
    // The regression that matters: a migration parser that stripped "." as a
    // thousands separator turned 119.95 into 11995, and nothing else in the
    // data showed it. Compare against the collection's own distribution rather
    // than a hardcoded ceiling — sectors differ.
    for (const [name, items] of Object.entries(collections)) {
      const prices = items
        .map((i) => i.data.price)
        .filter((p): p is number => typeof p === "number")
        .sort((a, b) => a - b);
      if (prices.length < 20) continue;
      const median = prices[Math.floor(prices.length / 2)];
      for (const item of items) {
        if (typeof item.data.price !== "number") continue;
        expect(
          item.data.price,
          `${name}/${item.slug} is ${item.data.price}, median is ${median}`
        ).toBeLessThan(median * 20);
      }
    }
  });
});
