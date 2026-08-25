# Changelog

## 2026-08-19 — what the design review exposed

The trial site was defensible in every particular and flat as a whole. The
client's words: *"the website ends up looking boring."* Their diagnosis was a
change of method, not a list of fixes, and it is now the biggest single change
to Phase 3.

### Look at real competitors, by fetching them — required, not optional

`04-design-system.md` now requires fetching three or four real sites in the
sector and answering five questions **in writing** before choosing anything:
what is above the fold, what is in the header, how wide is the content, how do
people reach a product, what repeats on every page. The answers go into
`design/brief.md` as a table.

Reasoning about a sector from memory produces correct margins, sane hierarchy,
and no reason for anyone to look twice. Ten minutes of fetching produced three
findings that would not have been guessed: the national chain carries 54
product cards on its homepage, both comparators run 1280–1400px wide, and both
keep a route into the catalogue permanently on screen.

A second failure mode is now named: **under-designing in the name of
restraint.** "Small business" is not a licence for a thin, timid page. If the
result is defensible but boring, that is a failure, and the fix is usually more
density and more of the brand colour, not more sections.

### Look at the rendered page — also required

Typecheck, tests, `next build` and `validate.py` between them will not notice
that every product on the site is titled `waldlaufer 4883`, that a grid is
three columns where it should be five, or that a section reads as an empty band
of colour. Screenshot the deployed pages, **full-page**, at 1440px and 390px,
and look at them.

Three faults in this round were found that way and by nothing else:

- 884 products titled from a raw brand id, because `titleFor` read a
  module-level map that only the owner's screen ever populated. Now
  `titleFor(data, labels)`, with the caller building the map from facts.
- A footer grid with four columns and three columns of content.
- Two homepage rows both taking "the first five", so one repeated the other
  exactly — a property of the page, not of any component, and invisible in a
  viewport-height screenshot.

### New in the template

- `PageIntro` — an inner-page masthead, which also fixed four pages that had no
  `h1` at all. Tested: exactly one h1-carrying block per page, and it is first.
- `ProductGrid` gains `background`, `variety` (one item per brand before a
  second of any) and `offset` (skip the first N).
- `ProductCard`, with white plates and hover zoom — catalogue photography is
  shot on white, so a tinted plate shows as a grey band around the product.
- `lib/links.ts` — every link leaving the site opens in a new tab with
  `rel="noopener noreferrer"`, guarded by a source scan.
- `app/icon.svg` — a favicon placeholder, with a note to draw the business's
  own and check it at 16px.
- `weekSchedule()` in `lib/hours.ts`, and the timezone test that goes with it.
- Palette gains `brandDark` and `brandTint`. One brand colour used in two
  places gives a white site with a coloured button.
- A `container` width table, because getting it wrong is the most visible way
  a site looks weaker than its competitors.
- Maps: embed a real one, default to OpenStreetMap — no key, no account, no
  cookies, so no consent banner.

### Template bugs found by scaffolding it fresh

The template had not been scaffolded and built since it gained collections. It
did not compile: a missing `getCatalogue()`, a missing
`content/collections.json` that `/api/seed` imports, and a `FieldDef` with no
`filterable` field that `puck.config.tsx` reads. It also still depended on
`@measured/puck@0.19`, deprecated in favour of `@puckeditor/core`.

**Scaffold, install, typecheck, test and build the template after touching it.**
The project you are working in is not the test — it diverges the moment you
write anything client-specific. Four minutes, four faults.

### A seed that would have undone a migration

`/api/seed` is documented as idempotent, and was — until `/api/migrate-media`
copied the photographs into our own storage and rewrote the rows. The content
files still hold the harvested URLs, so re-running the seed would have pointed
884 products back at a server being switched off. Two idempotent steps are not
idempotent in sequence when the second rewrites what the first wrote.

### Standing rules, previously left to judgement

External links open in a new tab. The main menu includes a link home. Every nav
item has the same padding on both sides. One name per destination — if the menu
says "Home", the breadcrumb says "Home". Ship a favicon.

## 2026-08-18 (later) — what the first deployment exposed

Everything below came from actually deploying the trial site. None of it was
findable by building and testing alone, which is the lesson running through it.

### Everything runs from a browser — new principle, top of SKILL.md

The client had no local development environment and did not want one. The skill
failed that in three places: `npm run seed`, a planned local media-migration
script, and a handover document whose disaster-recovery instruction was "run
`npm run seed`" — which made the last-resort backup worthless to anyone without
a checkout.

Now: `POST /api/seed` with a button in `/beheer`, reading `content/*.json` from
the deployment. Data migrations follow the same shape — authenticated, batched,
resumable, with a button. `scripts/seed.ts` survives as the alternative, never
the documented path.

**Heuristic:** if you catch yourself writing "run X locally" into a guide,
build the route instead.

### The owner login did not exist

The architecture had promised magic-link auth from the beginning. There was no
login page, no callback route, and nothing that ever wrote a session cookie.
Two consequences:

- Nobody could sign in, so every write route returned 401 forever.
- `/beheer` had **no server-side auth check at all** — only the API routes
  checked, so the facts form, product list and page canvas rendered for anyone
  who guessed the URL.

A third trap was waiting for anyone who bolted a login on: the browser client
was built from plain `supabase-js`, which keeps its session in localStorage.
The server reads cookies. The browser would look signed in while every server
check disagreed — and any call needing the `authenticated` role, such as a
storage upload, would be refused by policy with nothing to explain why. That
bug was live in `CollectionManager`'s photo upload.

Added: `/inloggen`, `/auth/callback`, a `/beheer` layout that redirects, sign
out, `lib/supabase-browser.ts` (cookie-based) and `lib/supabase-server.ts` with
one shared `getUser()`.

**The real lesson is about verification.** Everything verified up to that point
was verifiable without credentials — typecheck, build, tests, rendering. Auth
is the first thing that is not, and it was therefore the first thing to be
quietly missing. A green build proved nothing about it. Phase gates should
require walking one authenticated path end to end.

### Supabase publishable and secret keys

`anon` and `service_role` are now labelled legacy and stop working at the **end
of 2026**. The template prefers `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and
`SUPABASE_SECRET_KEY`, falling back to the old names so a running deployment
does not go dark mid-migration. Verified by building and serving a real site
with only the publishable key set.

### A test suite and CI on every push

`tests/hours.test.ts` and `tests/content.test.ts`, plus
`.github/workflows/ci.yml` running typecheck, tests, `next build`, the Python
migration tests and `validate.py`. `validate.py` is vendored into the project
so it can check itself without the skill installed.

The build step deliberately gets no database credentials: every route is
`force-dynamic`, so nothing renders at build time. If CI ever needs secrets to
build, something has begun prerendering content.

Every case in `hours.test.ts` corresponds to a bug that reached a site. Verified
that the suite catches what it claims by reintroducing the price bug below.

### Repository setup is now a documented first step

Create `main` and make it the default branch **before pushing anything**. A
repository whose first push is a feature branch adopts that branch as its
default — leaving nothing to open a pull request against, and a deployment
platform that later offers the wrong production branch. Learned by doing it
wrong.

### A price parser that was silently wrong

The trial site wrote prices as `159,95` mostly and `119.95` occasionally.
Stripping every `.` as a thousands separator turned `119.95` into `11995` — ten
products at a hundred times their price. Nothing looked wrong: field populated,
type correct, migration reported success. Caught by eye.

Migration reports now print the distribution and flag outliers against the
collection's own spread. `references/07-collections.md` generalises it: report
the distribution of every number you migrate.

### The template no longer teaches its own anti-patterns

The placeholder homepage hard-coded a `tel:` link — the exact fact-duplication
the architecture forbids — and the placeholder hours used a season dated
`2026-01-01` to `2026-12-31`, which is the expiring-window bug the engine had
just been fixed for. A scaffolded site would have gone dark on 1 January.

A fresh scaffold now passes its own `npm run check`: 23 tests, zero validator
errors. A starting point that is green on day one means red means something.

### Smaller

- Puck moved to `@puckeditor/core`; `@measured/puck` is deprecated and frozen
  since January 2026.
- BTW check reworded — publishing the BTW-id is required for distance selling,
  not for a premises-only shop, and for a sole trader it is worth not
  publishing without cause.

## 2026-08-13 — first real-world run (vdwoerd.nl, shoe shop, Barneveld)

Everything here came out of one trial. Nothing is speculative.

### The template now builds

It compiled before but `next build` failed, and the failure was unhelpful.

- **`lib/supabase.ts`** reads env inside the factories with a named error.
  Previously read at module scope, so a missing variable surfaced as
  `Error: supabaseUrl is required` from inside the Supabase bundle — no
  variable name, no route.
- **`force-dynamic`** on the root layout and the owner routes. The layout reads
  facts, so every route including Next's built-in `/_not-found` needed the
  database at build time; the build died before reaching any project route.
- Verified end to end: scaffold from clean → `tsc --noEmit` → `next build`.

### Opening hours — three correctness bugs

- `isOpenNow` compared a UTC wall clock against local opening times. The
  `timezone` field existed and was never read, so on Vercel "open now" was
  wrong by one or two hours all year.
- `iso()` used `toISOString()`, so after midnight local time the engine
  answered about the previous day.
- `nextOpen` could return today at a time already past — "eerstvolgend open:
  dinsdag 09:30–17:30" at 18:00 on that Tuesday.
- Seasons may now omit `from`/`to` and apply all year. Requiring a window
  forced year-round businesses to invent a date that either lies or expires,
  and outside every season the engine returns closed — so the site went dark
  on 1 January.

### Collections — new content type

The skill modelled singletons (facts) and compositions (pages), and had nothing
for records the owner adds to over time: products, news, staff, dishes.

- `collection_items` table, jsonb data, GIN-indexed, RLS matching `pages`
- `lib/collections.ts` — definitions, queries, `getCatalogue()`
- `app/beheer/[collection]/` + `components/CollectionManager.tsx` — one generic
  owner screen, driven by the definition
- `components/blocks/ProductGrid.tsx` — stores a filter, never item data
- `references/07-collections.md`
- `scaffold.py` learned `ROUTE__collection`

### Freshness check — `harvest.py --freshness`

Reads server `Last-Modified` dates on images and writes `harvest/freshness.md`.

In the trial this reversed an already-agreed decision. Product photos were
being uploaded weekly; the site chrome had not moved in two and a half years.
A live catalogue in a dead template, and nothing else on the site said so.

Asymmetric failure: preserving a corpse is embarrassing, demolishing a live
workflow is irreversible.

### Validator false positives — fixed

These matter most, because a validator that cries wolf gets ignored.

- Alt-text check warned once per key name, so every correctly-authored block
  produced a warning.
- Year-in-season-label check fired on year-round seasons.
- `redirects.csv` was only looked for beside the project, never inside it.
- BTW warning reworded: publishing the BTW-id is required for distance
  selling, not for a premises-only business, and for a sole trader it is a
  number worth not publishing without cause.

### Harvest output

`embeds.md` listed each sitewide script once per crawled page — 135 rows for 3
integrations, burying the single-page booking widget the pass exists to find.
Now deduplicated by `(kind, src)`, annotated with where each appears, sorted
rarest-first.

### Dead integrations

New category. The trial site had no live integration and four dead ones:
Universal Analytics (stopped July 2023), AddThis (shut down 2023), a Twitter
link in the `#!` format retired around 2013, and a cookie banner existing only
for the dead analytics. Two of those actively harm. Never delete the account
behind an analytics property — it may hold history or sit in an agency's
shared account.

### Puck permissions

The `permissions` prop granted everything while the comment claimed header,
footer and root were locked. The header and footer were in fact always safe —
they render outside `<Render>`. Now genuinely locked: the page root has no
editable fields, and fact-driven blocks cannot be duplicated.

### Facts schema

- `prices` optional — a retailer prices the item, not the business
- `brands` — the highest-intent search terms an independent shop owns
- `predicates` — a royal warrant, a certification
- `externalPartner` on a service — outsourced work is a real dependency
- `_provenance` — Phase 2 mandates recording where each fact came from and
  there was nowhere to put it

### Blocks

- `Hero` gained `usePhone` (reference the number, don't type it) and a `beside`
  layout, for businesses whose only photography is wide letterbox crops
- `PriceTable` renders nothing when there is no prices fact
- `withFacts` returns `ReactNode`, so a block may render nothing

### New sector pack

`detailhandel` — shops with a storefront. Covers koopavond vs koopzondag,
holiday hours being absent rather than normal, hours drifting across
Google/Facebook/site, and prices in a lookbook going stale invisibly.

### Known, not fixed

- `scaffold.py` refuses to write into an existing directory — the normal case
  is an existing git repo, so you scaffold to temp and copy in.
- `getCatalogue()` loads every published item per request. Fine into the low
  thousands; past that a block needs its own query and pagination.
