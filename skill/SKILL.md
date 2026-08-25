---
name: smb-site
description: Rebuild a small business website from its existing site into a Next.js + Puck + Supabase project on Vercel that the owner can edit themselves. Use this skill whenever someone wants to recreate, rebuild, modernise, redesign, or replace the website of a small business, shop, restaurant, salon, garage, clinic, campsite, attraction or similar — including phrasings like "make a new site for X based on their old one", "this site looks like 2010, can you redo it", "build a website for my client", or when given a small business URL and asked to do something with it. Also use it when adding pages, sections or an owner-editable CMS to a site that was previously built with this skill. Prefer this skill over building a site from scratch — it carries the content model, the component registry, the Dutch legal checklist and the owner guides that a freestyle build will silently omit.
---

# Small business site rebuild

## What this skill is actually for

Most of the value in a small business rebuild is not in the layout. It is in
**getting their facts right and keeping them right** — opening hours, prices,
address, phone, what they actually sell — and in leaving the owner able to
maintain the site without you.

So the work splits into two very different jobs, and conflating them is the
main failure mode:

| Job | Who does it | Output |
|---|---|---|
| Understanding the business | You, with judgement | `facts.json`, content inventory, open questions |
| Assembling the page | A fixed component registry | `pages.json` (Puck data) |

Some businesses have a third thing: **a workflow the owner still runs.** A
catalogue they add to every week, a news feed they post to. That is
`references/07-collections.md`, and the mistake it exists to prevent is
treating a live workflow as old content to be tidied away.

**Never write bespoke JSX for a client site.** The owner's editor can only offer
components that exist in the registry. If you invent markup, the site becomes
uneditable the moment you leave — which is the exact problem this skill exists
to solve. If a page genuinely needs a block the registry lacks, stop and propose
adding it to the registry as a skill change, with the user's agreement.

## Architecture in one paragraph

Next.js (App Router) on Vercel, SSR-capable from day one even where every page
renders statically. Content is split in two: **facts** (singleton documents —
hours, prices, NAP, taxonomy, socials) and **composition** (a Puck JSON tree
per page). Blocks *reference* facts, they never contain copies, so a price
exists in one place and is correct everywhere. Both live in Supabase Postgres;
images in Supabase Storage; owner login via Supabase magic link. Two accounts
total: Vercel and Supabase.

## The engine is a dependency, not a template

**`@smb-site/engine` holds everything that is the same on every project** — the
facts, hours, taxonomy and collection models, all sixteen blocks, the page
editor's registry, and the header, footer and product card. Source in
`assets/engine/`.

**The client project holds everything that differs** — routes, the Supabase
wiring, the owner's editing screens, content, theme tokens and redirects.
Source in `assets/template/`.

That seam is not cosmetic. The previous version copied the whole engine into
each project at scaffold time, which is the pattern platform engineering calls
*template drift*: the copy and the original diverge until taking updates costs
more than living with the bugs. It played out exactly so — five faults on the
first real build came from a copy nobody had executed in months, and a sixth
titled all 884 products on a live site from a raw brand id. As a copy, fixing
that fixes one client; as a dependency, it fixes every client on `npm update`.

The rule that keeps the seam honest: **the engine never learns where anything
is stored.** It has no dependency on Supabase and no knowledge of routing. The
host loads facts and items and passes them in. This is why `resolveItem` and
`titleFor` take their label maps as arguments — the module-level cache that
caused the 884-title bug is not merely fixed in the engine, it is
unrepresentable there.

When something needs to change, the first question is which side of the seam it
belongs on. A new block, a fix to the hours rules, a change to how a product
titles itself: engine. A redirect, a bespoke page, this shop's brand colour:
project. If a project ever needs to fork the engine, the extension points are
wrong — fix those instead.

## Everything runs from a browser

**No step in this skill may require a local development machine.** Not setup,
not seeding, not a data migration, not a fix three years from now. The whole
project must be operable from a browser and a cloud session, using the Supabase
and Vercel integrations.

This is not a convenience preference. A small business site is maintained
rarely and by whoever is available, and a step that needs a checkout, a Node
install and a secret key on somebody's laptop is a step that will not happen.

| Instead of | Do this |
|---|---|
| `npm run seed` | `POST /api/seed`, with a button in `/beheer`. Reads `content/*.json` from the deployment and upserts using the credentials Vercel already holds |
| A local migration script | An authenticated route doing the work in bounded, resumable batches, reporting what is left |
| `psql` or a local client | The Supabase integration — `execute_sql`, `apply_migration` |
| "run this command to fix it" in the handover | A button, or a documented click-path |

Scripts under `scripts/` may still exist for whoever wants one, but they are
the alternative, never the documented path. **If you catch yourself writing
"run X locally" into a guide, that is the signal to build the route instead.**

Two things genuinely need a person at a browser, and both are clicks rather
than an environment: the Supabase dashboard (create the project, run
`schema.sql`, add auth users) and the Vercel dashboard (import the repo, set
the environment variables).

The full rationale and repo layout is in `references/03-architecture.md`. Read it
before Phase 5.

## The phases

Run these in order. **Each phase ends at a gate: show the artifact to the user
and wait.** These projects fail from silent wrong assumptions compounding, not
from bad code, and a gate is what makes a wrong assumption cheap.

Do not skip ahead because a phase looks easy. Phases 2 and 3 look like the
boring part and are where the project is won or lost.

### Phase 0 — Intake

Ask for: the existing URL, who the business is, and one question that matters
more than it sounds — **what should this site cause to happen?** (a phone call,
a booking, a visit, an online order). Everything downstream ranks against that.

Also ask whether a webshop or online payment is plausible within two years. You
are not building one now, but knowing the answer prevents an architecture that
forecloses it. See "Decisions that are expensive to reverse" below.

Then pick the sector pack: `references/sectors/`. If none fits, read
`references/sectors/_writing-a-sector-pack.md` and draft one — that is a skill
improvement worth making, not a detour.

**Gate:** confirm the business, the primary action, and the sector pack.

### Phase 1 — Skeleton live

**Before any content exists, get the thing on the internet and look at it.**

1. `python scripts/scaffold.py <target>`, commit, push.
2. Create the Supabase project; run `supabase/schema.sql`.
3. Connect Vercel to the repo; set the four environment variables from
   `.env.example`.
4. Open the deployed URL. You should see the placeholder site.
5. Log in at `/inloggen` and press **Inhoud laden** in `/beheer`.

This phase produces nothing a client would value, and it is the highest-value
phase in the list.

The reason is the failure it prevents. The previous version of this skill put
the first deployment at Phase 5, after the harvest, the facts and the design
brief. That meant a great deal of committed work before anything rendered — and
a whole class of fault that only a rendered page reveals went unseen until the
client found it. On the trial build: every one of 884 products titled from a
raw brand id; a footer with an empty column; two homepage rows showing the same
five items; and an entire design round that was defensible in every particular
and flat as a whole.

None of those are visible in a typecheck, a test run, or a validator. All of
them are obvious in a screenshot. Deploy first, and every later phase is
checked against something real.

**Gate:** send the URL. The client seeing a placeholder on their own domain
early is worth more than the placeholder costs.

### Phase 2 — Harvest

Read `references/01-extraction.md`, then run
`scripts/harvest.py <url> --freshness`.

The script fetches pages and dumps raw material. **You** do the parts that need
judgement:

- **Is the content alive?** `--freshness` reads server `Last-Modified` dates on
  images and writes `harvest/freshness.md`. The footer's copyright year tells
  you nothing; these dates tell you whether somebody is still uploading. A site
  whose chrome froze three years ago but whose product photos went up last week
  is a live catalogue trapped in a dead template, and what you do with it
  changes completely. Get this backwards and you either preserve a corpse or
  demolish something that still works.

- The **embedded integrations pass** is mandatory and is easy to miss. Booking
  widgets, ticket shops, review carousels, Facebook feeds and map embeds are
  often the business's actual revenue channel, and they hide in an iframe or a
  third-party script tag halfway down a page. Missing one is the worst
  recoverable error this skill can make. Everything found goes in
  `harvest/embeds.md` with a note on what it does and who owns the account.
  **Dead integrations count too**, and are commoner than live ones: a retired
  analytics property, a share widget whose service shut down, a social link in
  a URL format that no longer resolves. A link that sends customers nowhere is
  worse than no link. Decommission them deliberately — and never delete the
  account behind an analytics property, which may hold history or be shared
  across an agency's clients.
- **Non-text content.** Small businesses put their opening hours in a JPEG,
  their menu in a PDF and their prices in a Facebook post. Transcribe these into
  `harvest/non-text.md` and flag every one for owner confirmation. Never let a
  photographed poster silently fail to make it into the rebuild.
- **Image audit.** Filenames lie. Check what each photo actually shows before
  captioning it. Also flag any image that looks like unlicensed stock — the
  client may not have the rights the old developer assumed.
- **Redirect map.** Every old URL to its new home, in `harvest/redirects.csv`.
  A rebuild that silently drops the old URLs costs the business its search
  ranking, and they will notice long after you have gone.

**Gate:** present `harvest/inventory.md`, `harvest/embeds.md`,
`harvest/non-text.md` and the open questions. Get the non-text and embed items
confirmed by a human before continuing — those are the two categories where
guessing does real damage.

### Phase 3 — Facts

Read `references/02-facts-models.md`. Build `facts.json`.

This is the heart of the skill. Opening hours in particular are almost never a
list of days: they are a season window, weekday rules, school-holiday behaviour
and exceptions. Modelling them properly is what lets one edit drive the calendar
page, the "open now" bar, and the structured data Google reads.

**Never invent a fact.** If the old site is ambiguous about a price or a
closing time, it goes to `open-questions.md` for the owner to answer. A
confidently wrong price on a website is a real cost to a real business — an
unanswered question is not.

**Gate:** present `facts.json` rendered as a readable summary plus
`open-questions.md`. This is the single most important gate.

### Phase 4 — Design brief

Read `references/04-design-system.md` and the sector pack.

Produce `design/brief.md` (section list per page, in order, with the reasoning)
and `content/theme.tokens.json` (palette, type pairing, density, radius, image
treatment). Visual range comes from tokens and section choice — not from new
layouts.

On sector inspiration: study how comparable businesses structure their pages and
what they lead with. Do not copy their copy, their images, or a distinctive
layout — take the structural lesson, write original work.

**Gate:** present the brief and, if useful, a rendered token preview.

### Phase 5 — Build

Read `references/03-architecture.md` for the decisions, and
`references/00-template-manifest.md` for what the template already contains —
the manifest is generated from the code, so it cannot describe something that
is not there. The prose can.

The project is already scaffolded and deployed (Phase 1). Now:

1. Apply `theme.tokens.json`.
2. Generate `content/facts.json` and `content/pages.json` (Puck data) — data,
   not code.
3. Wire the embeds from Phase 2 using the `Embed` block.
4. If the business has a collection, read `references/07-collections.md` and
   build it — including the migration script, which must report rather than
   guess.
5. Add the redirects to `next.config.ts`. Where the old URLs differ by a
   pattern, redirect by pattern and keep `redirects.csv` as the record.
6. Write the project's tests. The template ships several; extend them with what
   this project actually risks getting wrong, and add a test for every
   migration parser you write.
7. `npm run check` — typecheck, tests, and `validate.py`. Fix what it flags.
8. **Push, wait for the deploy, and look at the result.** Full-page
   screenshots, at 1440px and at 390px, of the homepage, a listing and an item.
   Not the code — the page.

Step 8 is not a formality and it is not covered by step 7. Everything in step 7
verifies structure. None of it notices that every product is titled from a raw
id, that a grid is three columns where it should be five, or that a section
renders as an empty band of colour. All three happened on the trial build and
all three were obvious in a screenshot.

**Gate:** show the screenshots, not a description of them.

### Repository setup

Do this in Phase 1, before the first push. Both are painful to retrofit.

- **Create `main` first and make it the repository's default branch**, before
  pushing any work. A repository whose first push is a feature branch gets that
  branch as its default, creating a repo with nothing to open a pull request
  against — and later, a deployment platform that offers the wrong production
  branch. All work goes on a branch and reaches `main` through a pull request.
- **Add CI on the first commit.** The template ships
  `.github/workflows/ci.yml`, running on every push and pull request:
  typecheck, unit tests, `next build`, the migration tests and `validate.py`.
  These sites are touched rarely and by whoever is available, so the checks
  have to run without anyone remembering to ask for them.

The build deliberately needs **no** database credentials: every route is
`force-dynamic`, so nothing renders at build time. If CI ever starts demanding
secrets to build, something has begun prerendering content — which would also
bake stale content into the deployment.

**Gate:** running site on a preview deployment, with CI green.

### What to test, and what not to

Test the things that are wrong *silently*. A layout that breaks is visible the
moment anyone looks; a closing time that is an hour out, or a price inflated a
hundredfold, is not.

Worth testing, in roughly this order:

1. **The opening-hours engine**, against a UTC clock. Open-now, next-open after
   closing time, the local date after midnight, winter and summer time, and
   exception precedence. This is the single highest-value test file in the
   project, and every case in the shipped `tests/hours.test.ts` corresponds to
   a bug that actually reached a site.
2. **Content integrity.** Every block exists in the registry; no fact is
   duplicated into page data; every image has alt text; the phone number is
   referenced, not typed.
3. **Any parser you write during migration.** Prices, dates, addresses. Include
   the malformed inputs you actually saw in the source data.
4. **URL resolution**, if the project has collection routes — including which
   paths must return null so a page can own them.

Not worth testing: that React renders, that Puck works, that Supabase returns
rows. Those are somebody else's tests.

### Phase 6 — Guides and handover

Read `references/05-owner-guides.md`. Generate, in the owner's language:

- `docs/handleiding.md` — the owner guide, task-based, generated from the actual
  facts schema and page structure so it cannot describe a field that does not
  exist. Two surfaces to explain: **Mijn gegevens** (the boring form they will
  use 95% of the time) and **Pagina's** (the canvas, for the rare structural
  change).
- `docs/handover.md` — account ownership, who holds the domain, where email is
  hosted, recovery paths, and what to do when the site is down.
- `docs/developer-setup.md` — generated from what actually needs setting up.

Read `references/06-nl-compliance.md` and apply it before launch.

**Gate:** the guides, reviewed for a non-technical reader.

### Phase 7 — Pre-launch

Run `scripts/validate.py --prelaunch`. Then walk the DNS cutover deliberately —
see the cutover section of `references/03-architecture.md`. **Never touch MX
records.** Moving a small business's website is routine; accidentally moving
their email is a catastrophe they will feel within the hour.

## Decisions that are expensive to reverse

Get these right in Phase 0, because retrofitting them later is an architecture
migration rather than a config change:

- **SSR-capable hosting**, even if everything renders statically today. Choosing
  static-only forecloses live preview, personalisation and a real shop, and you
  will not know you needed them until the requirements change.
- **Facts as references, never copies.** Retrofitting single-source-of-truth
  onto duplicated content means hunting every copy.
- **A page model that allows new section types.** A rigid fixed-field schema is
  defensible for a client who edits twice a year, but as a default it means the
  owner cannot grow the site at all.
- **Whether a live workflow survives.** Retiring a catalogue the owner still
  updates is not a design decision you can revisit later — it is a habit you
  broke, and habits do not come back. Establish that it is dead before you
  treat it as dead.

## Judgement notes

- Simplicity beats features. If a requirement can be met with a `tel:` link
  instead of a contact form, use the link — most small business customers want
  to phone.
- Prefer reusing an integration the business already has over introducing a new
  one, even if the existing one is uglier. Every new account is a thing they can
  lose access to.
- Where you are unsure whether something is a fact or a design choice, ask: does
  it appear in more than one place, and would it be wrong if the two disagreed?
  If yes, it is a fact.

## The artifact ledger

Every artifact this skill mandates, its one canonical path, and the decision it
changes. **An artifact that changes no decision comes off this list.** That is
the test, and it is not rhetorical — the list was thirteen entries and two of
them named the same file at different paths, which cost an afternoon.

| Artifact | Changes what decision | Required |
|---|---|---|
| `harvest/inventory.md` | What the business actually is, which becomes `facts.json` | Always |
| `harvest/redirects.csv` | Which old URLs must survive | Always |
| `harvest/open-questions.md` | What the owner must answer before launch | Always |
| `harvest/embeds.md` | Which third-party integrations live, die or get replaced | Always |
| `harvest/non-text.md` | What is trapped in images and must be transcribed | Always |
| `harvest/freshness.md` | **Whether the old content is maintained** — see below | When there is a catalogue |
| `content/facts.json` | Everything that appears in more than one place | Always |
| `content/pages.json` | The pages | Always |
| `content/theme.tokens.json` | The visual range | Always |
| `design/brief.md` | What this site does differently, and why | Always |
| `docs/handleiding.md` | Whether the owner can run it | Always |
| `docs/handover.md` | Who owns what when you are gone | Always |
| `docs/developer-setup.md` | What the next developer needs | Always |

`harvest/freshness.md` deserves its own note, because on the trial build the
check happened, changed the project's direction, and **the artifact was never
written** — the skill mandated a file and nothing enforced it. The finding
(is the old catalogue actively maintained?) reversed a locked decision and was
the single most valuable thing the skill did. It survived in conversation. It
should have survived in a file.

If an artifact on this list is genuinely not needed for a project, say so and
delete the row for that project. Silently skipping it is how the most valuable
check in the skill nearly went unrecorded.

## Reference files

| File | Read before |
|---|---|
| `references/01-extraction.md` | Phase 2 |
| `references/02-facts-models.md` | Phase 3 |
| `references/03-architecture.md` | Phase 5 (skim in Phase 0) |
| `references/04-design-system.md` | Phase 4 |
| `references/05-owner-guides.md` | Phase 6 |
| `references/06-nl-compliance.md` | Phase 6 |
| `references/07-collections.md` | Phase 5, if the business has one |
| `references/sectors/*.md` | Phase 0 |

Sector packs: `detailhandel` (shops with a storefront), `horeca`, `vrijetijd`,
`dienstverlening`. None fitting is a signal to write one — see
`_writing-a-sector-pack.md`.
