#!/usr/bin/env python3
"""Generate references/00-template-manifest.md from the template itself.

The reference prose is written in the present indicative — "writes go through
/api/publish", "the owner signs in with a magic link". That reads as a
description of shipped code. It was not: there was no login page, no callback
route, and nothing that ever wrote a session cookie. The architecture document
had described an intention, and it was read as an inventory.

The fix is to stop asking prose to be an inventory. This file is generated from
the template on disk, so it cannot describe something that is not there. The
prose says what to *decide* and what to *build*; the manifest says what you
already have.

Regenerate whenever the template changes:
    python scripts/manifest.py
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
TEMPLATE = SKILL / "assets" / "template"
OUT = SKILL / "references" / "00-template-manifest.md"

# The engine is the repository root; the skill lives in skill/. Falls back to
# the older in-skill location so this works from a standalone copy.
ENGINE = SKILL.parent
if not (ENGINE / "package.json").is_file():
    ENGINE = SKILL / "assets" / "engine"


def route_path(p: Path) -> str:
    """ROUTE__ folders ship renamed because archives reject square brackets."""
    parts = []
    for part in p.relative_to(TEMPLATE / "app").parts[:-1]:
        if part.startswith("ROUTE__optional_catch_all_"):
            parts.append("[[..." + part[len("ROUTE__optional_catch_all_"):] + "]]")
        elif part.startswith("ROUTE__"):
            parts.append("[" + part[len("ROUTE__"):] + "]")
        else:
            parts.append(part)
    return "/" + "/".join(parts) if parts else "/"


def exports(path: Path) -> list[str]:
    src = path.read_text(encoding="utf8", errors="replace")
    found = re.findall(
        r"^export\s+(?:async\s+)?(?:function|const|type|class)\s+([A-Za-z0-9_]+)",
        src,
        re.M,
    )
    return sorted(set(found))


def first_doc_line(path: Path) -> str:
    """The first sentence of the file's explanatory comment.

    Comments in this template usually sit *below* the imports, so scan for the
    first comment block rather than requiring one at the top. Skips the
    machine-directed ones (eslint, ts-, GENERATED)."""
    src = path.read_text(encoding="utf8", errors="replace")
    lines = src.splitlines()[:80]
    buf: list[str] = []
    for raw in lines:
        line = raw.strip()
        if line.startswith("/**") or line.startswith("/*"):
            line = line.lstrip("/*").strip()
        elif line.startswith("*/"):
            if buf:
                break
            continue
        elif line.startswith("*"):
            line = line.lstrip("*").strip()
        elif line.startswith("//"):
            line = line.lstrip("/").strip()
        elif buf:
            break
        else:
            continue
        if any(line.startswith(x) for x in ("eslint", "ts-", "@ts", "GENERATED", "prettier")):
            continue
        if line:
            buf.append(line)
        elif buf:
            break
    text = " ".join(buf)
    if not text:
        return ""
    sentence = re.split(r"(?<=[.!?])\s", text)[0]
    return sentence.strip()[:100]


def section(title: str, rows: list[tuple[str, str]], headers: tuple[str, str]) -> str:
    if not rows:
        return ""
    out = [f"## {title}\n", f"| {headers[0]} | {headers[1]} |", "|---|---|"]
    for a, b in rows:
        safe = b.replace("|", r"\|")
        out.append(f"| `{a}` | {safe} |")
    return "\n".join(out) + "\n"


def main() -> int:
    if not TEMPLATE.is_dir():
        print(f"no template at {TEMPLATE}", file=sys.stderr)
        return 1

    # Routes
    routes = []
    for p in sorted((TEMPLATE / "app").rglob("*.tsx")) + sorted((TEMPLATE / "app").rglob("*.ts")):
        if p.name not in ("page.tsx", "route.ts", "layout.tsx"):
            continue
        kind = {"page.tsx": "page", "route.ts": "API route", "layout.tsx": "layout"}[p.name]
        routes.append((route_path(p), f"{kind} — {first_doc_line(p) or ''}".rstrip(" —")))

    # Blocks in the registry — the list an owner can actually place on a page
    config = (ENGINE / "src" / "puck.config.tsx").read_text(encoding="utf8")
    blocks = []
    for name, label in re.findall(r"^      ([A-Za-z]+): \{\n        label: \"([^\"]+)\"", config, re.M):
        blocks.append((name, label))

    # lib modules and what they export
    libs = []
    for p in sorted((ENGINE / "src").glob("*.ts*")):
        if p.name == "index.ts":
            continue
        libs.append((p.name, ", ".join(exports(p)) or "—"))

    shell_libs = []
    for p in sorted((TEMPLATE / "lib").glob("*.ts*")):
        shell_libs.append((f"lib/{p.name}", ", ".join(exports(p)) or "—"))

    # Facts the type system knows about
    facts_src = (ENGINE / "src" / "facts.ts").read_text(encoding="utf8")
    m = re.search(r"export type Facts = \{(.*?)\n\};", facts_src, re.S)
    fact_keys = []
    if m:
        for line in m.group(1).splitlines():
            km = re.match(r"\s{2}(\w+)(\??):", line)
            if km:
                fact_keys.append((km.group(1), "optional" if km.group(2) else "required"))

    tests = [(f"engine/tests/{p.name}", first_doc_line(p) or "—")
             for p in sorted((ENGINE / "tests").glob("*"))]
    tests += [(f"tests/{p.name}", first_doc_line(p) or "—")
              for p in sorted((TEMPLATE / "tests").glob("*"))]

    def count(root):
        f = sum(1 for p in root.rglob("*") if p.is_file() and ".git" not in p.parts)
        n = sum(len(p.read_text(encoding="utf8", errors="replace").splitlines())
                for p in root.rglob("*")
                if p.is_file() and p.suffix in (".ts", ".tsx"))
        return f, n

    files, lines = count(TEMPLATE)
    e_files, e_lines = count(ENGINE / "src")

    body = f"""# What the template actually contains

<!-- GENERATED by scripts/manifest.py — do not edit by hand. Regenerate after
     changing assets/template/. -->

**This file is generated from `assets/template/` on disk.** Everything listed
here exists. Anything not listed here does not exist yet, whatever the other
reference files may say about it in the present tense.

That distinction is the whole point of this document. `03-architecture.md`
described a magic-link login in the present indicative; there was no login
page, no callback route, and nothing that wrote a session cookie. The prose was
an intention and was read as an inventory. Read the prose for what to *decide*
and *build*; read this for what you *have*.

**Engine** (`@smb-site/engine`): {e_files} files, {e_lines} lines — a
dependency, shared by every project.
**Shell** (`assets/template/`): {files} files, {lines} lines — copied once per
project, then owned by it.

Verified by
`python scripts/selftest.py`, which scaffolds it and runs typecheck, tests and
a production build — see `.selftest.json` for when that last passed.

{section("Routes", routes, ("Path", "What it is"))}
{section("Blocks in the Puck registry", blocks, ("Component", "Label the owner sees"))}
{section("Engine modules — import from @smb-site/engine", libs, ("Module", "Exports"))}
{section("Shell modules — the project owns these", shell_libs, ("Module", "Exports"))}
{section("Keys on the Facts type", fact_keys, ("Key", "Required?"))}
{section("Tests that ship with the template", tests, ("File", "What it holds the line on"))}
## What the template does NOT include

Generated by absence, so treat it as a prompt rather than a guarantee — check
the lists above before assuming something is missing.

- **A collection.** `lib/collections.ts` ships a `PRODUCTEN` definition as a
  worked example. A project without a catalogue should delete it; a project
  with one should replace it. See `07-collections.md`.
- **Content.** `content/facts.json` and `content/pages.json` ship as
  placeholders. Phase 4 replaces them.
- **A favicon of the business's own.** `app/icon.svg` is a placeholder circle.
- **Redirects.** `next.config.ts` ships empty; Phase 3's `redirects.csv` is the
  input.
- **Anything sector-specific.** The sector packs are guidance, not code.
"""

    OUT.write_text(body)
    print(f"wrote {OUT.relative_to(SKILL)}")
    print(f"  {len(routes)} routes, {len(blocks)} blocks, {len(libs)} lib modules, {len(tests)} test files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
