# Architecture

## The stack

| Layer | Choice | Why this one |
|---|---|---|
| Framework | Next.js, App Router | SSR-capable by default; React, so the editor is a route not a service |
| Hosting | Vercel | Preview deployments per branch; the owner never sees a build step |
| Editor | Puck (`@puckeditor/core`) at `/beheer` | Drag-and-drop over *your* components; outputs JSON; MIT, no lock-in |
| Content store | Supabase Postgres | Facts and page trees as JSONB |
| Images | Supabase Storage | Same account as the database |
| Owner login | Supabase Auth, magic link | No password for the owner to lose |
| Analytics | Vercel Web Analytics | Cookieless, so no consent banner |
| Forms | `tel:`/`mailto:` by default | Most small business customers phone |

Two accounts: Vercel and Supabase. Resist adding a third.

**No step may require a local machine** — see the browser-only rule in
`SKILL.md`. Seeding and data migrations are authenticated routes with buttons
in `/beheer`, not scripts someone runs on a laptop.

**Everything renders through SSR-capable routes even when output is effectively
static.** This is deliberate. Static-only forecloses live preview and a real
shop, and requirements change after launch far more often than anyone plans for.

## Content model: facts + composition

Two stores, and the relationship between them is the whole design.

```
facts             — singleton documents. Hours, prices, NAP, services, socials.
                    One row per site. Edited via a plain form.
pages             — one Puck JSON tree per page. Composition only.
collection_items  — repeating records that grow over time: products, news,
                    staff. Optional; many sites have none. One layout, many
                    rows. See references/07-collections.md.
```

A block **references** a fact; it never contains a copy:

```jsonc
// in pages.json — correct
{ "type": "PriceTable", "props": { "factRef": "prices", "tiers": ["kind", "volwassen"] } }

// wrong — the price is now duplicated and will drift
{ "type": "PriceTable", "props": { "rows": [{ "label": "Kinderen", "amount": 7 }] } }
```

Resolution happens server-side in `lib/facts.ts` before render. The editor shows
the resolved value so the owner sees real content, but edits it in the facts
form, not on the canvas. Where a block would let someone type over a fact,
disable the field and link to the facts form instead — a field that looks
editable but silently diverges is worse than one that is clearly read-only.

## Repo layout

```
app/
  [[...slug]]/page.tsx        # renders a page from its Puck tree
  beheer/                     # owner area (auth required)
    page.tsx                  # "Mijn gegevens" — the facts form + setup buttons
    SeedButton.tsx            # runs /api/seed from the browser
    paginas/[slug]/page.tsx   # "Pagina's" — the Puck canvas
    [collection]/page.tsx     # "Producten" etc — one screen per collection
  api/publish/route.ts
  api/seed/route.ts           # loads content/*.json — no local machine needed
  layout.tsx
components/
  blocks/                     # THE REGISTRY — one file per block
  CollectionManager.tsx       # the owner's add/edit form for any collection
lib/
  puck.config.tsx             # block registration + field definitions
  facts.ts                    # types, fetch, resolve
  collections.ts              # collection definitions and queries
  hours.ts                    # opening-hours rule engine
  supabase.ts
  jsonld.ts
content/
  facts.json                  # seed
  pages.json                  # seed
  collections.json            # seed, if there is a collection
  theme.tokens.json
supabase/schema.sql
docs/                         # generated in Phase 6
```

**Every route is `force-dynamic`.** The root layout reads facts, so all
content comes from Supabase at request time. Prerendering would need database
credentials during the build and would bake in whatever was in the database
when the deploy ran. It also means the app will not build without its env
vars — which is the correct failure, loudly rather than silently.

## The two editing surfaces

This split is what makes the site both safe and editable, and it maps directly
onto how often each thing changes.

**Mijn gegevens** — a plain form over `facts`. Hours, prices, phone, address,
socials. Impossible to break. This is 95% of what the owner will ever do, and
for many businesses it is 100%.

**Pagina's** — the Puck canvas. Add a section, reorder, swap a block type. Used
rarely, but its absence is exactly what makes a rigid CMS feel like a dead end.

Constrain the canvas with Puck's permissions API: header, footer and root are
locked; block fields are enums and references rather than free CSS. The owner
should be able to rearrange the site without being able to make it ugly.

## Component registry

The registry is shared by the generator and the editor. That shared-ness is the
point: whatever the skill can produce, the owner can subsequently edit, because
they are the same components.

Baseline blocks (see `references/04-design-system.md` for their design intent):

`Hero` · `QuickLinks` · `FeatureRow` · `CardGrid` · `PriceTable` ·
`HoursSummary` · `HoursCalendar` · `Gallery` · `TextSection` · `FAQ` ·
`CTABand` · `MapContact` · `Embed` · `Testimonials`

Adding a block is a change to the skill, not to a client project. If a site
seems to need something new, say so at the gate and get agreement.

`Embed` deserves a note: it is how Phase 2's findings survive. It takes a
provider, a URL or embed snippet, an aspect ratio and a title, and renders in an
iframe with `loading="lazy"` and a sensible `sandbox`. Reusing the business's
existing booking widget through this block is nearly always better than
integrating its API.

## Supabase schema

See `assets/template/supabase/schema.sql`. Four tables — `facts`, `pages`,
`collection_items`, `media` — plus row level security allowing anonymous read
of published rows and nothing anonymous writing.

Seeding runs from `content/*.json` through **`POST /api/seed`**, triggered by a
button in `/beheer`, so no local machine is needed. `scripts/seed.ts` does the
same work for anyone who does have a checkout, but it is the alternative.

## Deployment and cutover

1. Create `main` and make it the repository's default branch before pushing
   anything. A repo whose first push is a feature branch adopts that branch as
   its default, and the deployment platform will then offer the wrong
   production branch.
2. Push to GitHub, import to Vercel, add the environment variables.
3. Deploy on the `.vercel.app` domain.
4. Add a Supabase auth user, open `/beheer`, and press **Laden** to seed. Run
   any data migration from its button there too.
5. Review on the `.vercel.app` domain.
6. Add redirects from `harvest/redirects.csv` to `next.config.ts`.
7. Only then, the domain.

The domain step is where these projects hurt people. Before touching anything:

- Find out **where the business's email is hosted**. Very often it is on the
  same domain as the website. **Never modify MX records.** Changing A/CNAME
  records for the website is routine; taking down a business's email is not, and
  they will discover it within the hour.
- Record the current DNS zone before changing it.
- Lower TTL a day ahead if the registrar allows it.
- Change A/CNAME only. Verify the site, then verify mail still flows.
- Update the Google Business Profile URL afterwards.

If the business does not know who holds their domain, that is a Phase 0 open
question, not a launch-day surprise.
