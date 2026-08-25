import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// ProductGrid moved from dept/category/brand props to a generic `filters`
// array. A shared engine deploys *before* anyone migrates the page data that
// feeds it — code ships in seconds, a data migration is a separate manual act
// — so for the window between them the component must read both shapes.
//
// This is not hypothetical. On the first migration the code went live and the
// database did not, and the failure was silent: an unknown prop is ignored, so
// every filtered row simply stopped filtering. Two homepage rows showed
// identical items and the women's row showed a men's brand. Nothing failed to
// build, typecheck or test.

const source = readFileSync("src/components/blocks/ProductGrid.tsx", "utf8");

describe("legacy filter props", () => {
  it("still reads dept, category and brand", () => {
    // A structural check rather than a render: the component is a server
    // component and this is the cheapest honest way to hold the line.
    for (const prop of ["dept", "category", "brand"]) {
      expect(source, `ProductGrid dropped the legacy \`${prop}\` prop`).toMatch(
        new RegExp(`\\b${prop}\\?: string`)
      );
    }
    expect(source).toContain("activeFilters");
  });

  it("prefers the new shape where both are present", () => {
    expect(source).toMatch(/if \(props\.filters\?\.length\) return props\.filters/);
  });

  it("says out loud that removing these is a major version", () => {
    // The comment is the contract. Anyone deleting these props needs to know
    // that a site's stored page data has to migrate first.
    expect(source).toMatch(/major version/i);
  });
});
