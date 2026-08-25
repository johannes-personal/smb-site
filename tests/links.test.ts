import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { externalProps, isExternal } from "../src/links";

describe("externalProps", () => {
  it("opens anything on another origin in a new tab", () => {
    for (const href of [
      "https://www.google.com/maps/dir/?api=1&destination=x",
      "http://example.com",
      "//cdn.example.com/x",
      "https://www.facebook.com/vanderWoerdSchoenen",
    ]) {
      expect(externalProps(href), href).toEqual({
        target: "_blank",
        rel: "noopener noreferrer",
      });
    }
  });

  it("leaves our own pages alone", () => {
    for (const href of ["/dames", "/dames/schoenen/gabor/2701", "#inhoud", "", undefined]) {
      expect(externalProps(href as string), String(href)).toEqual({});
    }
  });

  it("leaves tel: and mailto: alone", () => {
    // These hand off to a dialer or a mail client. A blank tab left behind is
    // litter the visitor has to close.
    expect(isExternal("tel:+31342412952")).toBe(false);
    expect(isExternal("mailto:info@example.nl")).toBe(false);
  });
});

describe("every anchor that can leave the site", () => {
  // A missing target="_blank" is invisible in review and in the tests — the
  // link works, it just takes the visitor away. This scans for the shape.
  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...walk(full));
      else if (/\.tsx$/.test(entry)) out.push(full);
    }
    return out;
  }

  // The engine's own components. The host runs the same scan over its app/.
  const files = walk("src");

  it("hard-codes no external href without opening a new tab", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      // Each <a ...> element, whole.
      for (const tag of source.match(/<a\s[^>]*>/g) ?? []) {
        if (!/href=\{?[`"']https?:\/\//.test(tag)) continue;
        expect(tag, `${file}: ${tag.slice(0, 70)}`).toMatch(/target="_blank"/);
        expect(tag, `${file}: ${tag.slice(0, 70)}`).toMatch(/noopener/);
      }
    }
  });

  it("routes every non-literal href through the helper", () => {
    // No exemption list. An href built from a prop, a fact or a catalogue path
    // may be anything, and externalProps is a no-op on internal links — so the
    // rule is absolute and there is nothing to argue about at review time.
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const tag of source.match(/<a\s[^>]*>/g) ?? []) {
        const href = tag.match(/href=(\{[^}]*\}|"[^"]*")/)?.[1];
        if (!href) continue;
        // An href whose text begins with a slash or a hash is internal
        // whatever is interpolated into the rest of it.
        if (/^("|\{`)(\/|#)/.test(href)) continue;
        // tel:/mailto: hand off to another app; a blank tab is litter.
        if (/(tel:|mailto:)/.test(href)) continue;
        expect(tag, `${file}: ${tag.replace(/\s+/g, " ").slice(0, 90)}`).toMatch(
          /externalProps|target="_blank"/
        );
      }
    }
  });
});
