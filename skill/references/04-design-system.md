# Phase 4 — Design

Visual range comes from **tokens plus section choice**, not from new layouts.
This is the constraint that makes the whole skill work: the owner can only edit
components that exist, so the components must be good enough that constraining
them is not a loss.

## Theme tokens

`content/theme.tokens.json`:

```jsonc
{
  "palette": {
    "brand": "#1b683d",       // from the business's own materials where possible
    "brandInk": "#ffffff",
    "accent": "#e8a33d",
    "ink": "#1a1a1a",
    "muted": "#5c5c5c",
    "surface": "#ffffff",
    "surfaceAlt": "#f6f4ef"
  },
  "type": {
    "pairing": "warm-serif" ,  // warm-serif | clean-sans | editorial | utility
    "scale": "comfortable"     // compact | comfortable | generous
  },
  "shape": { "radius": "soft", "borders": "hairline" },
  "imagery": { "treatment": "full-bleed", "ratio": "4:3" },
  "density": "airy",
  "container": "wide"
}
```

**`container`** sets the page width, and getting it wrong is the single most
visible way a site looks weaker than its competitors:

| Value | Width | For |
|---|---|---|
| `reading` | 768px | Prose-led sites: a practice, a consultancy |
| `standard` | 1024px | A handful of services, few images |
| `wide` | 1280px | Most businesses with something to show |
| `full` | 1440px | Catalogues and grids — retail, galleries, listings |

Anything showing a grid of goods wants `wide` or `full`. A four-column product
grid inside a 1024px column gives each item about 230px, which is smaller than
the competition and reads as a placeholder.

Pick the brand colour from something the business already owns — their signage,
their van, their logo — rather than inventing one. Small businesses have visual
identity even when they have no brand guidelines, and matching it is both more
respectful and more useful than a fashionable palette.

Four type pairings, four density settings and a palette give plenty of range.
If a site needs something outside this, that is a signal to extend the token
schema in the skill, not to write one-off CSS.

## Using sector inspiration well

**This is a required step, not an optional one, and it means actually fetching
the sites.** Reasoning about what a sector's websites are like, from memory,
produces something that is defensible in every particular and lifeless as a
whole — correct margins, sane hierarchy, and no reason for anyone to look at
it twice.

Pick three or four real competitors — ideally one at the client's scale and one
much larger — fetch them, and answer these in writing before choosing anything:

- **What is above the fold?** Count it. If every comparable site puts its goods
  on the homepage and yours puts three text links to category pages, you have
  not made a considered choice; you have made a quiet mistake.
- **What is in the header?** A header with a logo and nothing else is a header
  the sector does not have.
- **How wide is the content?** Retail and catalogue sites run wide — 1200 to
  1400px. A 1024px column reads as a blog. Note the number.
- **How do people reach a product?** Mega-menu, sidebar, search, or a flat
  grid. If a visitor needs three clicks and a hover to see a shoe, that is the
  finding.
- **What is repeated on every page** — phone, opening status, shops, basket.

Then extract **structure**, not surface:

- What does the page lead with? (a photo, a price, a phone number, availability)
- What does a visitor need to decide to come? Usually: is it open, what does it
  cost, where is it, is it right for my situation
- Where does the primary action sit, and how often is it repeated
- What content earns its place, and what is filler that every site in the sector
  copies from every other

Write the answers into `design/brief.md` as a short table, so the design
decisions can be argued with later.

Then write original copy and choose original imagery. Do not reproduce another
business's wording, photography, or a distinctive layout — take the lesson, not
the artefact.

Two failure modes, and the second is the one this skill actually falls into:

1. **Averaging** — looking at four sites and producing the mean of them. Sector
   packs exist to prevent this by encoding a point of view.
2. **Under-designing in the name of restraint.** "Small business" is not a
   licence for a thin, timid page. A shop with 900 products and a 137-year
   history should not look like a landing page for a consultancy. Restraint
   means few section *types* and a disciplined palette — not narrow columns,
   empty headers, and the goods hidden two clicks down. If the result is
   defensible but boring, that is a failure, and the fix is usually more
   density and more of the brand colour, not more sections.

## The blocks and what each is for

| Block | Use it when |
|---|---|
| `Hero` | Above the fold. One image, one promise, one primary action |
| `PageIntro` | The masthead of an inner page that has no hero. Carries the `h1` |
| `QuickLinks` | The three or four things most visitors came for |
| `FeatureRow` | One thing explained properly, image beside text |
| `CardGrid` | Several comparable things — services, attractions, dishes |
| `PriceTable` | References `facts.prices`. Never hand-typed |
| `HoursSummary` | References `facts.hours`. Compact "when are you open" |
| `HoursCalendar` | Month view for seasonal or irregular businesses |
| `Gallery` | Proof it is a real place. Captions matter more than count |
| `TextSection` | Prose. Constrained rich text — headings, bold, links, lists |
| `FAQ` | Real questions the business gets asked, not invented ones |
| `CTABand` | Repeat the primary action after a long scroll |
| `MapContact` | Address, parking, phone and a **real embedded map**. References `facts.nap` |
| `Embed` | Existing third-party widget from Phase 2 |
| `Testimonials` | Only with real, attributable reviews |

Every page needs exactly one block that renders an `h1`, and it must be first.
A page opening on a `TextSection` has no `h1` at all — its headings are `h2` —
which tells a screen reader and a search engine nothing about what the page is.
That is what `PageIntro` is for, and it is worth a test rather than a habit.

## Showing goods

If the site has a catalogue, these are conventions, not preferences, and
getting them wrong is what makes a shop look neglected:

- **Plate the photography on white.** Supplier photography is shot on white.
  Any tinted plate — including a tasteful `surfaceAlt` — shows as a grey or
  brown band around the product. `background: #fff` with
  `mix-blend-mode: multiply` on the image also absorbs the JPEGs whose own
  background is not quite white.
- **Zoom on hover**, around 1.3–1.4×, behind `@media (hover: hover) and
  (prefers-reduced-motion: no-preference)`. It is the convention in clothing
  and footwear, and it is cheaper than a lightbox: no dialog, no focus trap,
  nothing to close, and nothing to go wrong on a phone. Reach for a lightbox
  only when there are several photographs per item.
- **Crop to the product's shape.** Square for shoes, bags and boxes; 4:3 leaves
  air above and below and makes a grid look sparse.
- **Five columns on a wide screen, two on a phone.** Four inside a narrow page
  gives each item ~230px, which reads as a placeholder.
- **Alternate the background** between product rows on a long page — a plain
  option and a brand-tint one. Rhythm without new section types.
- **Spread a row across brands, and offset the second row.** Two rows that both
  take "the first five" show the same five items, and a row of five from one
  maker sells that maker rather than the shop. One item per brand before a
  second of any, plus an `offset` on the row below, fixes both. This is only
  visible in a screenshot of the whole page — each row is correct on its own.

## Navigating a catalogue

Filters belong **beside** the goods, not above them. Chips across the top are
the obvious first attempt and they fail the same way every time: they scroll
away, so from the third row onward there is no way to narrow the search without
going back up.

One sticky sidebar, shared by every listing — department, category, brand —
with counts computed from the collection so a category that empties stops being
offered instead of leading to a blank page. Cap a listing and say so ("48 of
412 — choose a kind or a brand"): a department with several hundred items is
slow on a phone and no easier to shop when it is all on one page.

An index page for the axis the visitor is choosing on (brands, makers,
designers) is a page of tiles with a borrowed product photo, not a list of
words and not a mixed product grid.

## Page composition principles

- **Lead with the decision.** A visitor to a small business site is deciding
  whether to phone, visit or book. Everything above the fold serves that.
- **Answer the boring questions early.** Open? Price? Where? These outrank the
  business's story, however much the owner loves the story.
- **Repeat the primary action.** Once in the hero, once mid-page, once in the
  footer.
- **Mobile first, genuinely.** Most of this traffic is someone on a phone
  deciding what to do this afternoon.
- **Fewer sections than feels right.** Six good sections beat eleven.

## Maps

**Embed a real map wherever the visitor has to travel to the business.** A
button saying "plan your route" answers a question the visitor has not asked
yet; they want to see whether it is near the car park before they commit. This
is the single most common gap between a small business site and a competent
one.

Default to **OpenStreetMap**, which needs no API key, no account and sets no
cookies — so it does not drag a consent banner back into a site that had
managed to avoid one:

```
https://www.openstreetmap.org/export/embed.html?bbox=…&marker=lat,lon
```

Google Maps is the alternative when the client insists on it or needs Street
View. It sets cookies before the visitor interacts with anything, which means a
consent banner and a mention in the privacy statement. Say that out loud before
choosing it rather than discovering it at the compliance step.

Either way the map needs a `title`, `loading="lazy"`, and a route link beside
it for people who want turn-by-turn.

## Look at the page

**Before calling a design round finished, screenshot the deployed pages and
look at them.** Not the code, not the test output — the rendered page, at
1440px and at 390px, on the homepage, a listing and an item.

Everything else in this workflow verifies structure. Typecheck, tests,
`next build` and `validate.py` between them will not notice that every product
on the site is titled `waldlaufer 4883` instead of `Waldlaufer 4883`, that a
Tailwind class silently failed to compile, that a grid is three columns wide
where it should be five, or that a section reads as an empty band of colour.
All of those have happened, and all of them are obvious in a screenshot.

If the deployment sits behind preview authentication and the browser cannot
reach it, fetch the HTML instead and check for the things you changed — the
class names, the block order, the heading text. It is weaker than looking, but
it is far better than assuming.

## Standing rules for links, navigation and the tab

Small things, each of which looks like an oversight when missed, and all of
which are the same every time. Do them by default rather than when asked.

- **Every link that leaves the site opens in a new tab**, with
  `rel="noopener noreferrer"`. A visitor who taps "plan your route" and lands
  in Google Maps has left; on a phone, coming back means finding the browser
  again. `noopener` also stops the opened page reaching back through
  `window.opener`. Route this through one helper (`lib/links.ts`) rather than
  remembering it per anchor, and guard it with a test that scans the source —
  a missing `target` is invisible in review, because the link still works.
  `tel:` and `mailto:` are the exception: they hand off to another app, and a
  blank tab left behind is litter.
- **The main menu includes a link home.** The logo usually links home too, but
  not everyone knows that, and the audience for a lot of these sites is
  precisely the people who do not.
- **Every navigation item has the same padding on both sides.** Zeroing the
  first item's left padding to align it with the container looks clipped the
  moment items have hover backgrounds. Pull the whole list out by one step
  inside the container instead — and never with a negative margin on the
  container itself, which kills its centring.
- **One name per destination.** If the menu says "Home", the breadcrumb says
  "Home" too.
- **Ship a favicon.** A default globe in the tab is the clearest signal a site
  is unfinished. Draw something of the business's own — its trade, not its
  initials — as an SVG at `app/icon.svg`. Silhouette, not outline: at 16px
  hairlines vanish and only mass reads. **Render it at 16, 32 and 96px and
  look at it**; a shape that works at 96 is routinely a blob at 16, and two or
  three iterations is normal.

## Accessibility baseline

Not optional and not expensive: 4.5:1 contrast on body text, visible focus
states, real heading order, alt text that describes the photo rather than
naming the file, tap targets of 44px, and the whole site usable by keyboard.
`scripts/validate.py` checks what it can, but check the contrast of the chosen
palette yourself — brand colours frequently fail against white.
