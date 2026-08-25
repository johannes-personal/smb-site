#!/usr/bin/env python3
"""
Checks the generated project against the things that actually go wrong.

    python validate.py [project_dir] [--prelaunch]

--prelaunch adds the launch checklist: redirects filled in, KvK/BTW present,
open questions resolved, guides generated.

Exit code 1 if anything in the "error" class fails.

## The rule this file lives by

**A check that can be wrong is worse than no check.** Five of this validator's
findings on the trial build were false — alt text warned per key name, a
year-in-label warning fired on undated seasons, the redirects path was wrong,
the BTW rule was too blunt. Each false positive teaches the reader to skim the
next one, and the next one is the true positive. The validator's whole value is
that its output is worth reading.

So every check here belongs to exactly one class, and the classes have
different bars:

- **`err()` — invariants.** Structural facts that cannot be a matter of
  judgement: a required file is absent, a phone number is not E.164, a page
  references a block that is not in the registry. These are provable from the
  data. If a check cannot be stated as "X is true or the site is broken", it
  does not belong here.
- **`warn()` — the narrow heuristics that have earned their place.** A warning
  is allowed to be a guess, but only where a false positive is rare *and* the
  true positive is expensive. The duplicated-phone-number check qualifies: it
  found a real phone number typed into page data on the trial build, and it
  cannot fire on correct content because correct content references the fact.

**When a heuristic fires falsely, delete it rather than tune it.** Tuning
produces a check that is wrong less often, which is the same failure spread
thinner. A validator with six checks that are always right beats one with
twenty that are usually right.
"""

import argparse
import json
import os
import re
import sys

ERRORS: list[str] = []
WARNINGS: list[str] = []


def err(msg):
    ERRORS.append(msg)


def warn(msg):
    WARNINGS.append(msg)


def load_json(path):
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def check_facts(root):
    facts = load_json(os.path.join(root, "content/facts.json"))
    if facts is None:
        return err("content/facts.json is missing")

    nap = facts.get("nap", {})
    for field in ("legalName", "phone", "phoneDisplay"):
        if not nap.get(field):
            err(f"facts.nap.{field} is empty")
    if not nap.get("address", {}).get("city"):
        err("facts.nap.address is incomplete")

    if not re.match(r"^\+\d{6,}$", nap.get("phone", "")):
        err("facts.nap.phone must be E.164 (e.g. +31612345678) so tel: links work")

    hours = facts.get("hours", {})
    if hours.get("mode") != "appointment":
        if not hours.get("seasons"):
            err("facts.hours has no seasons — hours drive the calendar, the open-now bar and the JSON-LD")
        for season in hours.get("seasons", []):
            # Only dated seasons go stale. A season with no from/to is the
            # year-round case — most businesses — and demanding a year in its
            # label would push someone into inventing a window that expires.
            if not (season.get("from") or season.get("to")):
                continue
            if not re.search(r"\d{4}", season.get("id", "") + season.get("label", "")):
                warn(f"season '{season.get('id')}' has no year in its label — its staleness will be invisible next year")

    prices = facts.get("prices", {})
    if prices.get("externalSource") and not prices["externalSource"].get("warning"):
        err("facts.prices.externalSource needs a warning — a third party holds a second copy of these prices")

    return facts


def check_pages(root, facts):
    pages = load_json(os.path.join(root, "content/pages.json"))
    if pages is None:
        return err("content/pages.json is missing")

    config_path = os.path.join(root, "lib/puck.config.tsx")
    registry = set()
    if os.path.exists(config_path):
        with open(config_path, encoding="utf-8") as fh:
            registry = set(re.findall(r"^\s{6}(\w+): \{$", fh.read(), re.M))

    price_amounts = {t["amount"] for t in facts.get("prices", {}).get("tiers", [])} if facts else set()
    phone = (facts or {}).get("nap", {}).get("phoneDisplay", "")

    for slug, page in pages.items():
        if slug.startswith("_"):
            continue
        for block in page.get("data", {}).get("content", []):
            btype = block.get("type")
            if registry and btype not in registry:
                err(f"page '{slug}' uses block '{btype}', which is not in the registry — "
                    f"the owner would not be able to edit it")

            blob = json.dumps(block.get("props", {}), ensure_ascii=False)

            # Facts must be referenced, not copied. A duplicated price is a fact
            # that will silently diverge.
            for amount in price_amounts:
                if re.search(rf"\b{amount}\b", blob) and btype != "PriceTable":
                    warn(f"page '{slug}' block '{btype}' appears to contain the price {amount} "
                         f"directly — reference facts.prices instead")
            if phone and phone in blob:
                warn(f"page '{slug}' block '{btype}' contains the phone number directly — "
                     f"use usePhone or facts.nap instead")

            # Either key satisfies the check — blocks name it imageAlt, arrays
            # of images name it alt. Warning once per missing key meant every
            # correctly-authored block still produced a warning, which is how a
            # validator teaches people to ignore it.
            if (
                btype in ("Hero", "FeatureRow")
                and '"image"' in blob
                and not any(f'"{k}"' in blob for k in ("imageAlt", "alt"))
            ):
                warn(f"page '{slug}' block '{btype}' has an image without alt text")

            if btype == "Embed" and not block.get("props", {}).get("title"):
                err(f"page '{slug}' has an Embed without a title — screen readers need one")


def check_prelaunch(root, facts):
    # harvest/ usually sits inside the project — the harvest script writes it
    # relative to wherever it was run — but it may also be a sibling when the
    # harvest was done before the project directory existed. Look in both
    # rather than warning about a file that is right there.
    redirects = next(
        (p for p in (
            os.path.join(root, "harvest", "redirects.csv"),
            os.path.join(root, "..", "harvest", "redirects.csv"),
        ) if os.path.exists(p)),
        None,
    )
    if redirects:
        with open(redirects, encoding="utf-8") as fh:
            rows = [r for r in fh.read().splitlines()[1:] if r.strip()]
        blank = [r for r in rows if r.split(",")[1].strip() == ""]
        if blank:
            err(f"{len(blank)} of {len(rows)} old URLs have no destination — "
                f"dropping them costs the business its search ranking")
    else:
        warn("harvest/redirects.csv not found — confirm the old URLs are handled")

    nap = (facts or {}).get("nap", {})
    if not nap.get("kvk"):
        err("KvK number missing — required for a business trading in the Netherlands")
    if not nap.get("btw"):
        # Deliberately softer than the KvK check. Publishing the BTW-id is
        # required for distance selling, not for a shop whose customers walk
        # in — and for a sole trader it is a number worth not publishing
        # without cause. Do not push a client into stating it by default.
        warn("BTW number missing — required if the business sells at a distance "
             "(webshop, ordering by phone or email). Not required for a "
             "premises-only business; leave it empty if so")

    oq = os.path.join(root, "..", "harvest", "open-questions.md")
    if os.path.exists(oq):
        with open(oq, encoding="utf-8") as fh:
            unresolved = fh.read().count("- [ ]")
        if unresolved:
            err(f"{unresolved} open questions are unanswered — these are the facts "
                f"nobody has confirmed yet")

    for doc, why in [
        ("docs/handleiding.md", "the owner cannot maintain the site without it"),
        ("docs/handover.md", "nobody will know who holds the domain in two years"),
        ("docs/developer-setup.md", "the next developer starts from nothing"),
    ]:
        if not os.path.exists(os.path.join(root, doc)):
            err(f"{doc} is missing — {why}")

    # The artifact ledger in SKILL.md. Enforced because on the trial build the
    # freshness check ran, changed the project's direction, and its file was
    # never written — the skill mandated it and nothing checked.
    ledger = [
        ("harvest/inventory.md", "what the business is"),
        ("harvest/redirects.csv", "which old URLs survive"),
        ("harvest/open-questions.md", "what the owner still has to answer"),
        ("design/brief.md", "what this site does differently, and why"),
    ]
    for rel, why in ledger:
        if not os.path.exists(os.path.join(root, rel)) and not os.path.exists(
            os.path.join(root, "..", rel)
        ):
            err(f"{rel} is missing — it records {why}")

    # Conditional: only a project with a collection needs the freshness finding,
    # but for those it is the check most likely to change the whole approach.
    if os.path.exists(os.path.join(root, "content/collections.json")):
        found = any(
            os.path.exists(os.path.join(root, p))
            for p in ("harvest/freshness.md", "../harvest/freshness.md")
        )
        if not found:
            err(
                "harvest/freshness.md is missing — this project has a collection, so "
                "whether the old one is actively maintained decides the whole approach"
            )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project", nargs="?", default=".")
    ap.add_argument("--prelaunch", action="store_true")
    args = ap.parse_args()

    facts = check_facts(args.project)
    check_pages(args.project, facts)
    if args.prelaunch:
        check_prelaunch(args.project, facts)

    for w in WARNINGS:
        print(f"warn  {w}")
    for e in ERRORS:
        print(f"ERROR {e}")

    if not ERRORS and not WARNINGS:
        print("All checks passed.")
    print(f"\n{len(ERRORS)} errors, {len(WARNINGS)} warnings")

    # Reminders no script can check.
    if args.prelaunch:
        print(
            "\nStill to verify by hand:\n"
            "  - Contrast of the brand colour against white (brand colours often fail)\n"
            "  - What each embed loads, and whether it sets cookies\n"
            "  - Image rights, and consent for identifiable people\n"
            "  - Where the business's email is hosted — never touch MX records\n"
            "  - Walk the owner guide's three most likely tasks using only the guide"
        )

    sys.exit(1 if ERRORS else 0)


if __name__ == "__main__":
    main()
