#!/usr/bin/env python3
"""
Copies assets/template into a new project directory and restores the Next.js
dynamic route folders.

Why this exists: Next.js names dynamic routes with square brackets
(app/[[...slug]]), and skill archives reject paths containing those characters.
The template therefore ships them as ROUTE__* placeholders, and this script
renames them back. Run it once, at the start of Phase 5 — the project will not
route correctly until you do.

Usage:
    python scaffold.py <target-dir> [--template <path to assets/template>]
"""

import argparse
import os
import shutil
import sys

# placeholder directory name -> real Next.js route segment
ROUTE_MAP = {
    "ROUTE__optional_catch_all_slug": "[[...slug]]",
    "ROUTE__catch_all_slug": "[...slug]",
    "ROUTE__slug": "[slug]",
    "ROUTE__collection": "[collection]",
    "ROUTE__id": "[id]",
}


def restore_routes(root):
    renamed = []
    # Walk bottom-up so renaming a parent never invalidates a pending child path.
    for dirpath, dirnames, _ in os.walk(root, topdown=False):
        for name in dirnames:
            if name in ROUTE_MAP:
                src = os.path.join(dirpath, name)
                dst = os.path.join(dirpath, ROUTE_MAP[name])
                os.rename(src, dst)
                renamed.append(os.path.relpath(dst, root))
    return renamed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("target")
    ap.add_argument("--template", default=os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "assets", "template"))
    args = ap.parse_args()

    template = os.path.abspath(args.template)
    if not os.path.isdir(template):
        sys.exit(f"Template not found at {template}")
    if os.path.exists(args.target):
        sys.exit(f"{args.target} already exists — pick an empty directory.")

    shutil.copytree(template, args.target)
    renamed = restore_routes(args.target)

    print(f"Scaffolded {args.target} from the template.")
    for path in sorted(renamed):
        print(f"  route: {path}")
    if not renamed:
        print("  warning: no ROUTE__ placeholders found — check the template is intact.")
    print(
        "\nNext:\n"
        "  1. Apply content/theme.tokens.json from Phase 4\n"
        "  2. Write content/facts.json and content/pages.json\n"
        "  3. Add the redirects from harvest/redirects.csv to next.config.ts\n"
        "  4. Push, connect Vercel and Supabase, then load the content from the\n"
        "     deployed site: log in at /inloggen and press 'Inhoud laden' in\n"
        "     /beheer. No local install and no `npm run seed` — see\n"
        "     references/03-architecture.md\n"
        "  5. python scripts/validate.py <target>"
    )


if __name__ == "__main__":
    main()
