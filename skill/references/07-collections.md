# Collections — the third content type

Facts are singletons the owner edits in a form. Pages are Puck trees the owner
rearranges on a canvas. A **collection** is neither: a set of records that grows
over time, sharing one layout, added to without touching composition.

Products. News items. Staff. Dishes. Vacancies. Locations.

Most projects need none. Skip this file unless the business has one.

## Deciding whether the business has a collection

Three questions. All three must be yes:

1. Are there more than about fifteen of them?
2. Do they all have the same shape?
3. Will the owner add more after handover?

Four staff members are a `CardGrid`. Forty products are a collection. Six
services are `facts.services`.

If the answer to (3) is no — a fixed list that never changes — it is a page,
not a collection. Do not build machinery for content that will never move.

## Before you decide what to do with an existing one: check whether it is alive

This is the step that is easy to skip and expensive to get wrong.

```bash
python scripts/harvest.py <url> --freshness
```

It reads server `Last-Modified` dates on the site's images and writes
`harvest/freshness.md`. The footer's copyright year tells you nothing; these
dates tell you whether a human is still uploading.

Two readings, two very different projects:

- **Chrome and content both stale.** A dead catalogue. Propose replacing it
  with something smaller and honest — a curated selection, a brands page. A
  catalogue frozen three years ago actively misleads customers.
- **Chrome stale, content fresh.** A live catalogue trapped in a dead template.
  Migrate it, and mirror the existing workflow. Somebody has kept this up for
  years; removing it is a change-management problem, not a design decision,
  and you will be taking away something that still works.

Read the clusters carefully. A spike of identical dates usually means a
platform migration rather than editorial activity — cross-check whether the
stylesheet and layout images share that timestamp. Discount that bucket.

## Modelling the fields

**Mirror the loop the owner already has, field for field.** Not the loop you
would design. If they currently type a model number and a price and upload one
photo, the new form has those three fields and nothing else.

This is the whole game. A form with two more fields than the old one is a form
that takes longer, and a task that takes longer than it used to is a task that
quietly stops happening. You get one chance to be faster than what they have;
spend it.

Improvements go in the handover conversation, framed as the owner's choice with
the cost stated in seconds per item:

> Right now the model number is the only thing Google can index. A colour field
> would make "black gabor boots" findable. It costs you one click per shoe.

Ask, then let them decide. Do not add optional fields unilaterally and hope —
an optional field left blank on 900 items was never worth adding.

Two more rules:

- **The slug is identity.** Derive it from fields that do not change. A slug
  built from a price or a description breaks every URL the day someone edits
  one.
- **Every option list is a fact, and the owner can edit it.** Not just the
  brands — the departments and the categories too. This is the one that got
  missed on the trial: brands were a fact with no UI anywhere, and categories
  were two `as const` arrays in two files, so adding a kind of shoe meant a
  code change and a deploy. A shop that starts stocking sandals should not have
  to phone anybody.

  Mark each such field `taxonomy: "categories"` and leave its `options` empty;
  `setTaxonomyOptions(facts)` fills them before the form renders. Ship
  `/beheer/taxonomie` with it — see **Editing the taxonomy** below.

## What it looks like in the template

| File | Role |
|---|---|
| `lib/collections.ts` | `CollectionDef` — fields, slug, URL, title. Register in `COLLECTIONS` |
| `app/beheer/[collection]/page.tsx` | One owner screen, driven by the definition. No per-collection screen to write |
| `components/CollectionManager.tsx` | The form and the list |
| `components/blocks/ProductGrid.tsx` | Shows items on a Puck page |
| `supabase/schema.sql` | `collection_items`, jsonb `data`, GIN-indexed |

Fields carry two flags worth using:

- `sticky` — kept when the owner clicks "save and add another". Deliveries
  arrive as twenty of one brand, not twenty different ones. This single flag
  is most of the speed difference.
- `filterable` — offered as a filter on the `ProductGrid` block.

## Blocks reference collections, exactly as they reference facts

A `ProductGrid` stores **a filter**, never item data. A corrected price is then
right on every page at once, which is the same property that makes facts work.

Puck renders synchronously, so a block cannot fetch for itself. The route
resolves the collection once via `getCatalogue()` and passes it to
`buildConfig`; blocks filter that array in memory. Fine into the low thousands
— a small business catalogue. Past that, give the block its own query and
paginate, and say so in `docs/developer-setup.md`.

## Giving items their own URLs

Collection items are **not** Puck pages, and this is deliberate. There are
hundreds and they share one layout; a canvas per item is a thousand ways to
make a thousand pages disagree. They render from one template, and the owner
changes them by editing the item.

Resolve their paths **inside the existing catch-all**, after the page lookup:

```ts
const page = await getPage(path || "home");
if (page) return renderPuckPage(page);

const view = resolveCataloguePath(segments);   // project-specific
if (!view) notFound();
return <CataloguePage view={view} … />;
```

A Puck page wins wherever one exists, so the owner can add a page at `/dames`
without colliding with a listing, and no route conflict has to be resolved in
the filesystem.

Two things to get right while you are there:

- **Never link a filter value with no items behind it.** `valuesWithItems()`
  exists for this. Menu entries leading to blank pages are one of the commonest
  faults in the sites this skill replaces — the shoe shop had fourteen.
- **A well-formed URL for something that does not exist is still a 404.** An
  empty listing page looks broken.

## Migrating an existing catalogue

Write the migration as a script that **reports rather than guesses**, and commit
its output. Silently dropping thirty products, or carrying over a photo filed
under the wrong brand, is worse than stopping and saying so.

Report at minimum: items the old site links to that 404, items missing a
required field, values not present in the corresponding fact list, and any
internal disagreement you can detect between two sources for the same field.

Sanity-check the detector before trusting its output. A first pass on the shoe
shop reported 226 brand mismatches; the real number was 14. The men's image
tree simply had an extra path segment, so the brand was the last directory and
never the second. A migration report that cries wolf gets ignored, and then the
14 real ones ship.

**Report the distribution of every number you migrate, and flag the outliers.**
Not against a fixed ceiling — a shoe shop and a jeweller have different normal
ranges — but against the catalogue's own spread. This is the check that catches
the faults nothing else will:

> The same shoe shop wrote prices as `159,95` most of the time and `119.95`
> occasionally. A parser that stripped every `.` as a thousands separator
> turned `119.95` into `11995`, and ten shoes were migrated at a hundred times
> their real price. Nothing in the output looked wrong — the field was
> populated, the type was right, the migration reported success.

Decide the decimal separator by what follows it (exactly two trailing digits
means it is the decimal point), never by assuming a locale, and print the
min/median/max so a human can see at a glance whether the numbers are
plausible.

**A long-running job must never report success from a stalled batch.** Write
the loop so "moved nothing this round" is a *stall* with the reasons attached,
not a finish. The obvious condition — stop when a batch moves zero — reads as
completion and prints a green message, which is the worst possible outcome
because nobody re-checks a green message. Only the server saying *nothing is
left* counts as done.

The trial made the point twice over. The photo migration reported progress
honestly and finished 879 of 884; the five that failed were images that no
longer exist on the old server, and are worth surfacing to the owner as
"these need a new photograph" rather than hiding as a failure count. Had the
loop exited on the first zero-progress batch, it would have claimed success
with hundreds still on the old host.

Related: **check a long job's progress in the database, not by watching the
UI.** A snapshot mid-run looks identical to a stall. Query the actual counts,
twice, a minute apart, before concluding anything has stopped.

Finally: **images usually still point at the old host after migration.** That
is fine until the old hosting is switched off, at which point every image on
the new site breaks at once. Put it in `docs/handover.md` as a blocking task,
not a nice-to-have.

**Two idempotent steps are not idempotent in sequence when the second rewrites
what the first wrote.** The seed loads `content/*.json` into the database; the
media migration then copies the photographs to your own storage and rewrites
the rows to point at them. The content files still hold the harvested URLs. So
re-running the seed — the one operation everyone believes is safe, and which
the owner is told to use — silently points the whole catalogue back at a server
that is being switched off.

The seed must read the existing rows first and let a migrated value win over
the file, and it must say how many it preserved. Assume any content file is a
snapshot of the import, not the current truth, for every field a later step
touches.

**Never derive an item's display text from module-level mutable state.** A
brand or category id stored on an item has to be turned into a name that lives
in facts, and the tempting shape is a module-level map filled by a `setOptions`
call. Whichever route calls it works; every other route renders the raw id.
On a serverless runtime it is worse than that — the map differs between
instances of the same deployment, so the fault is intermittent too.

Pass the map in: `titleFor(data, labels)`, with the caller building `labels`
from facts. And make the fallback read as a name rather than a slug — Title
Case the id, so a brand missing from facts shows "Josef Seibel" and not
"josef-seibel". A fallback that is obviously a placeholder gets noticed; one
that is merely slightly wrong ships.

This one shipped. It typechecked, it built, the tests passed and the validator
was clean — 884 products titled "waldlaufer 4883". It was found by looking at
a screenshot of the deployed page, which is the only thing that would have
found it.


## Editing the taxonomy

The lists behind an item's dropdowns — department, kind, maker — are facts, and
the owner edits them on their own screen at `/beheer/taxonomie`. Two rules make
that safe to hand over, and the interface has to teach both without a manual:

**The name is free; the id is not.** An id is in the URL of every item filed
under it (`/dames/schoenen/gabor/2701`). So it is generated once, by slugifying
the first name given, and then shown greyed out beside the field. Renaming
"Booties" to "Enkellaarsjes" changes every heading on the site and breaks
nothing, because the label never appears in a URL. This split is the whole
design; without it the owner's first rename 404s a few hundred pages and
invalidates whatever Google has indexed.

**Nothing in use can be removed.** Show the item count on every row and disable
the delete button when it is not zero, with the count in the tooltip — the
owner should see why before they try. Enforce it server-side too
(`taxonomyProblems()`): a browser tab can be stale, and the route is reachable
directly. Removing an entry does not delete the items; it orphans them, which
is worse, because nothing looks wrong in the database while every page under it
returns a 404.

Two smaller decisions worth copying:

- **The editor posts only what it owns.** A screen holding three lists that
  sends back a whole facts document will silently revert whatever another form
  changed in the meantime. `/api/taxonomie` takes the three lists, reads the
  current facts server-side, and merges — carrying over the fields the editor
  never knew about (`note`, `logo`, department scoping).
- **Order is the owner's, and it is the sidebar's.** `categoriesWithStock()`
  takes the declared order rather than sorting by count, so the list the owner
  arranged is the list the visitor sees. Up/down buttons rather than drag:
  usable with one hand on a phone.

Adding a kind does **not** add it to the main menu. That is deliberate —
`meta.nav` is the owner's editorial choice, not a mirror of the taxonomy — but
say so in the handover, because it is the obvious next question.
