# Phase 2 — Harvest

Goal: a human-verifiable inventory of everything the old site knows, plus an
honest list of what you could not determine.

Run `scripts/harvest.py <url> --out harvest/` first. It crawls same-domain
pages, saves raw HTML and text, extracts images with their surrounding context,
detects embeds, and writes a URL list. It does the mechanical part. The rest is
judgement.

## Outputs

```
harvest/
  raw/              # fetched HTML per page
  inventory.md      # the readable summary you present at the gate
  embeds.md         # third-party integrations already in use
  non-text.md       # content that only exists as image/PDF
  images.md         # what each photo actually shows
  redirects.csv     # old_path,new_path
  open-questions.md # things only the owner can answer
```

## The embedded integrations pass

Do this before anything else, because it changes what the rebuild has to
support. A small business site often has one integration that *is* the revenue,
bolted on years ago and never mentioned by anyone.

Look for:

- `<iframe>` of any kind — ticketing, booking, reservations, maps, video,
  menus, forms
- Third-party `<script src>` — chat widgets, review carousels, booking popovers,
  analytics, pixels, cookie banners
- Links that leave the domain to a booking or ordering host
- Social embeds and feeds
- A "shop" or "tickets" link that goes to a hosted storefront

For each, record in `embeds.md`:

| Field | Why it matters |
|---|---|
| What it is | So it survives the rebuild |
| What it does for the business | Distinguishes revenue from decoration |
| URL / embed code | So it can be reused verbatim |
| Who owns the account | You will need this at handover |
| Does it duplicate a fact? | e.g. prices in both the site and the ticket shop |

That last row matters. If a ticketing platform holds prices and the site also
shows prices, they *will* drift. Either the site should link out rather than
restate, or the divergence risk goes in the owner guide in plain language.

## Non-text content

Assume important content is not text. Check for:

- Opening hours as a photographed sign or a graphic
- A menu, price list or brochure as a PDF or JPEG
- Hours or announcements that only exist on the business's social profile
- Contact details baked into a header image

Transcribe each into `non-text.md` with the source, your transcription, and a
confidence note. Every one of these gets confirmed by a human at the gate. This
is the single highest-value part of the harvest and it is invisible to anything
automated.

## Image audit

Open the images. Filenames and alt text are frequently wrong — a file called
`cornfield.jpg` may show go-karts. Record in `images.md`: what the photo
actually shows, whether it is usable quality, and whether it looks like stock
photography the client may not have licensed. Flag anything doubtful rather than
silently reusing it.

## Redirect map

Every URL the old site exposed maps to something. Options, in order of
preference: the equivalent new page, the nearest parent, the homepage. Record
all of them in `redirects.csv`, including ones you think are dead — search
engines and old printed material may still point there.

Watch for: trailing-slash variants, `index.html`, language prefixes, and any URL
that appears in the business's Google Business Profile or printed flyers.

## Open questions

Anything you cannot determine from the site goes here, phrased so a
non-technical owner can answer it in one line. Typical entries:

- Ambiguous or contradictory prices
- Whether a listed service is still offered
- Which phone number is preferred
- Whether hours shown are current or last season's
- Who owns the domain and where email is hosted

Resist the temptation to fill these in from plausibility. Wrong facts on a
business website cost the business money and trust.

## Inventory summary

`inventory.md` is what you present at the gate. Structure it by what the
business *does*, not by the old site's page structure — the old structure is
often the thing being fixed. Include a short "what I could not determine"
section at the end, pointing at the open questions.
