#!/usr/bin/env python3
"""
Phase 2 harvest.

Crawls a small business site and dumps raw material for the inventory. It does
the mechanical part only: fetching, listing, and detecting things that are easy
to miss mechanically but catastrophic to miss in practice (embeds, PDFs,
images).

The judgement — what the content means, what survives, what the photos actually
show, whether the hours in that JPEG are current — is yours. See
references/01-extraction.md.

Usage:
    python harvest.py https://example.nl --out harvest/ [--max-pages 40]
"""

import argparse
import csv
import json
import os
import re
import sys
import urllib.parse as urlparse
from collections import OrderedDict

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Needs: pip install requests beautifulsoup4")

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; smb-site-harvest/1.0)"}

# Hosts that usually mean a real integration rather than decoration. Missing one
# of these is the worst recoverable error in a rebuild: it is often the
# business's actual revenue channel.
EMBED_HINTS = [
    "booking", "reserv", "ticket", "shop", "order", "bestel", "afspraak",
    "calendly", "eventbrite", "leisureking", "recras", "salonized", "treatwell",
    "formitable", "resengo", "thefork", "opentable", "mollie", "ideal",
    "youtube", "vimeo", "google.com/maps", "facebook", "instagram",
    "trustpilot", "kiyoh", "feedbackcompany",
]


def fetch(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        return r.text
    except Exception as exc:  # noqa: BLE001
        print(f"  ! {url}: {exc}", file=sys.stderr)
        return None


def same_site(base, url):
    return urlparse.urlparse(url).netloc.replace("www.", "") == \
           urlparse.urlparse(base).netloc.replace("www.", "")


def crawl(start, max_pages):
    seen, queue, pages = set(), [start], OrderedDict()
    while queue and len(pages) < max_pages:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        html = fetch(url)
        if not html:
            continue
        print(f"  · {url}")
        pages[url] = html
        soup = BeautifulSoup(html, "html.parser")
        for a in soup.find_all("a", href=True):
            nxt = urlparse.urljoin(url, a["href"]).split("#")[0].rstrip("/")
            if nxt and same_site(start, nxt) and nxt not in seen:
                queue.append(nxt)
    return pages


def analyse(pages, base):
    embeds, images, non_text, texts = [], [], [], {}

    for url, html in pages.items():
        soup = BeautifulSoup(html, "html.parser")

        for tag in soup(["script", "style", "nav", "footer"]):
            tag.decompose()
        texts[url] = re.sub(r"\n{3,}", "\n\n", soup.get_text("\n", strip=True))

        soup2 = BeautifulSoup(html, "html.parser")

        for frame in soup2.find_all("iframe"):
            embeds.append({"page": url, "kind": "iframe",
                           "src": frame.get("src", ""), "title": frame.get("title", "")})

        for script in soup2.find_all("script", src=True):
            src = script["src"]
            if not same_site(base, urlparse.urljoin(url, src)):
                embeds.append({"page": url, "kind": "script", "src": src, "title": ""})

        for a in soup2.find_all("a", href=True):
            href = urlparse.urljoin(url, a["href"])
            if href.lower().endswith((".pdf", ".doc", ".docx")):
                non_text.append({"page": url, "kind": "document", "src": href,
                                 "label": a.get_text(strip=True)})
            elif not same_site(base, href) and any(h in href.lower() for h in EMBED_HINTS):
                embeds.append({"page": url, "kind": "outbound link", "src": href,
                               "title": a.get_text(strip=True)})

        for img in soup2.find_all("img"):
            src = urlparse.urljoin(url, img.get("src", ""))
            if not src:
                continue
            images.append({"page": url, "src": src, "alt": img.get("alt", ""),
                           "filename": os.path.basename(urlparse.urlparse(src).path)})

    return embeds, images, non_text, texts


def write_outputs(out, base, pages, embeds, images, non_text, texts):
    os.makedirs(os.path.join(out, "raw"), exist_ok=True)
    for i, (url, html) in enumerate(pages.items()):
        with open(os.path.join(out, "raw", f"{i:02d}.html"), "w", encoding="utf-8") as fh:
            fh.write(f"<!-- {url} -->\n{html}")

    with open(os.path.join(out, "pages.json"), "w", encoding="utf-8") as fh:
        json.dump({u: t for u, t in texts.items()}, fh, ensure_ascii=False, indent=2)

    with open(os.path.join(out, "redirects.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["old_path", "new_path", "note"])
        for url in pages:
            path = urlparse.urlparse(url).path or "/"
            w.writerow([path, "", "FILL IN — every old URL needs a destination"])

    def md_table(rows, cols):
        out_lines = ["| " + " | ".join(cols) + " |",
                     "|" + "|".join(["---"] * len(cols)) + "|"]
        for r in rows:
            out_lines.append("| " + " | ".join(str(r.get(c, "")).replace("|", "/") for c in cols) + " |")
        return "\n".join(out_lines)

    # Deduplicate by (kind, src). A sitewide script tag is one integration, not
    # forty; listing it once per crawled page buries the one booking widget
    # that appears on a single page — the exact item this pass exists to find.
    grouped = OrderedDict()
    for e in embeds:
        key = (e["kind"], e["src"])
        if key not in grouped:
            grouped[key] = {**e, "pages": set()}
        grouped[key]["pages"].add(e["page"])
    unique = []
    for e in grouped.values():
        n = len(e["pages"])
        unique.append({
            "kind": e["kind"], "src": e["src"], "title": e["title"],
            "where": "sitewide" if n == len(pages) else f"{n} page(s): "
                     + ", ".join(sorted(e["pages"])[:3]) + (" …" if n > 3 else ""),
        })
    # Things appearing on one or two pages first — that is where the booking
    # widget and the ticket shop live.
    unique.sort(key=lambda e: len(grouped[(e["kind"], e["src"])]["pages"]))

    with open(os.path.join(out, "embeds.md"), "w", encoding="utf-8") as fh:
        fh.write(
            "# Embedded integrations (detected)\n\n"
            "Deduplicated by (kind, src) and sorted so the rarest appears first — an\n"
            "integration on one page is far more likely to be the business's revenue\n"
            "channel than a script on all of them.\n\n"
            "Automatic detection only. Confirm each one by hand and add: what it does\n"
            "for the business, who owns the account, and whether it duplicates a fact\n"
            "such as prices. An integration missed here is often the business's\n"
            "actual revenue channel.\n\n"
            "**Also check for dead ones.** A retired analytics property, a share widget\n"
            "whose service shut down, a social link in a URL format that no longer\n"
            "resolves. Those are not decoration to leave alone: a link that sends\n"
            "customers nowhere is worse than no link, and decommissioning them is real\n"
            "work with real risk — never delete the account behind an analytics\n"
            "property, it may hold history or be shared across an agency's clients.\n\n"
        )
        fh.write(md_table(unique, ["kind", "src", "title", "where"]) if unique
                 else "_None detected — verify by hand, detection is not reliable._\n")

    with open(os.path.join(out, "non-text.md"), "w", encoding="utf-8") as fh:
        fh.write(
            "# Content that is not text\n\n"
            "Documents found automatically are listed below. **Also check by hand for:**\n"
            "opening hours as a photographed sign, a menu or price list as an image,\n"
            "contact details baked into a header graphic, and hours that only exist on\n"
            "the business's social profile.\n\n"
            "Transcribe each one here with a confidence note, and have a human confirm\n"
            "it before launch. Never let a photographed poster silently fail to make it\n"
            "into the rebuild.\n\n"
        )
        fh.write(md_table(non_text, ["kind", "label", "src", "page"]) if non_text
                 else "_No documents detected._\n")

    with open(os.path.join(out, "images.md"), "w", encoding="utf-8") as fh:
        fh.write(
            "# Images\n\n"
            "Filenames and alt text are frequently wrong — open each image and record\n"
            "what it actually shows. Flag anything that looks like stock photography\n"
            "the client may not have the rights to, and any identifiable people\n"
            "(especially children) whose consent is not established.\n\n"
        )
        fh.write(md_table(images, ["filename", "alt", "src", "page"]))

    with open(os.path.join(out, "open-questions.md"), "w", encoding="utf-8") as fh:
        fh.write(
            "# Open questions for the owner\n\n"
            "Phrase each so it can be answered in one line. Never fill these in from\n"
            "plausibility — a wrong price or closing time sends customers to a locked\n"
            "door.\n\n"
            "- [ ] Who registered the domain, and where is your email hosted?\n"
            "- [ ] Are the opening hours on the current site up to date?\n"
            "- [ ] Are the prices on the current site up to date?\n"
            "- [ ] Which of the listed services do you still offer?\n"
            "- [ ] Do you own the rights to the photographs on the current site?\n"
        )

    print(f"\nWrote {len(pages)} pages, {len(unique)} distinct embeds, "
          f"{len(images)} images to {out}/")
    print("Next: read references/01-extraction.md and do the judgement passes.")
    print("Then run: python harvest.py --freshness <url>  (is the content alive?)")


def freshness(pages, base, out):
    """Is the content alive?

    The single most consequential question in a rebuild, and the copyright year
    in the footer does not answer it. Server Last-Modified dates on images do.

    A site whose chrome froze in 2021 but whose product photos were uploaded
    last week is not a dead site — it is a live catalogue trapped in a dead
    template. Removing that catalogue, or "improving" the workflow behind it,
    is then a change-management problem rather than a design decision, and
    getting this backwards is expensive.
    """
    from email.utils import parsedate_to_datetime

    srcs = []
    for url, html in pages.items():
        soup = BeautifulSoup(html, "html.parser")
        for img in soup.find_all("img"):
            src = urlparse.urljoin(url, img.get("src", ""))
            if src and same_site(base, src):
                srcs.append(src)
    srcs = list(OrderedDict.fromkeys(srcs))[:120]

    dated = []
    print(f"Checking Last-Modified on {len(srcs)} images …")
    for src in srcs:
        try:
            r = requests.head(src, headers=HEADERS, timeout=15, allow_redirects=True)
            lm = r.headers.get("Last-Modified")
            if lm:
                dated.append((src, parsedate_to_datetime(lm)))
        except Exception:  # noqa: BLE001
            continue

    if not dated:
        print("  no Last-Modified headers — this check tells you nothing here.")
        return

    by_month = OrderedDict()
    for _, when in sorted(dated, key=lambda d: d[1]):
        by_month.setdefault(when.strftime("%Y-%m"), 0)
        by_month[when.strftime("%Y-%m")] += 1

    path = os.path.join(out, "freshness.md")
    os.makedirs(out, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(
            "# Is the content alive?\n\n"
            "Server `Last-Modified` dates on same-site images. Read this before\n"
            "deciding what to do with a catalogue, a gallery or a news section:\n"
            "content that is still being maintained represents a working habit, and\n"
            "replacing a working habit is change management, not design.\n\n"
            "**Two cautions.** A cluster of identical dates is usually a platform\n"
            "migration rather than editorial activity — check whether the site's CSS\n"
            "and layout images share that timestamp. And a re-uploaded file looks the\n"
            "same as a new one.\n\n"
            f"Newest: **{max(d for _, d in dated).strftime('%Y-%m-%d')}** · "
            f"oldest: {min(d for _, d in dated).strftime('%Y-%m-%d')} · "
            f"{len(dated)} of {len(srcs)} images dated\n\n"
            "| Month | Images |\n|---|---|\n"
        )
        for month, n in by_month.items():
            fh.write(f"| {month} | {'#' * min(n, 40)} {n} |\n")

    newest = max(d for _, d in dated)
    print(f"  newest image: {newest:%Y-%m-%d}  ·  wrote {path}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--out", default="harvest")
    ap.add_argument("--max-pages", type=int, default=40)
    ap.add_argument("--freshness", action="store_true",
                    help="check Last-Modified dates on images — is the content alive?")
    args = ap.parse_args()

    base = args.url.rstrip("/")
    print(f"Crawling {base} …")
    pages = crawl(base, args.max_pages)
    if not pages:
        sys.exit("Nothing fetched. Check the URL.")
    embeds, images, non_text, texts = analyse(pages, base)
    write_outputs(args.out, base, pages, embeds, images, non_text, texts)
    if args.freshness:
        freshness(pages, base, args.out)


if __name__ == "__main__":
    main()
