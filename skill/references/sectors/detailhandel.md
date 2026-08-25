# Sector pack: detailhandel met een winkelpand

Shoe shops, clothing boutiques, bookshops, opticians, jewellers, bike shops,
cheese shops, florists, toy shops, hardware — an independent retailer whose
revenue comes through a physical door, who does not sell online, and who
competes with a chain on the same street and with the whole internet everywhere
else.

Not for: retailers whose primary channel is a webshop. That is a different
business with a different site.

## What the visitor is deciding

"Do they have something for me, and is it worth the trip?"

Two halves, and independents consistently answer only the second. *Something
for me* is the hard half: the visitor has a foot that hurts, a child who needs
a bike, a gift to buy. They want evidence the shop deals with their specific
case before they will spend a journey and a parking space on it. *Worth the
trip* is logistics — open now, where, parking.

The decision is nearly always made on a phone, often while already in town.
Assume the visitor has 40 seconds and one thumb.

The category killer here is **specificity about who the shop is for**. A chain
cannot say "we fit shoes over your own orthotics" or "we stock up to size 48".
An independent can, and usually buries it in paragraph three of the About page.

## Facts that matter here

- **Opening hours**, as the load-bearing fact. Retail hours are rarely a flat
  table: an afternoon-only weekday, a late-night koopavond, Sunday closed,
  koopzondagen as dated exceptions, and public holidays. Model all of it.
  See the traps below.
- **Address, and how to arrive** — parking, which car park, how far the walk,
  the nearest bus stop. For a high-street shop this is a genuine objection, not
  a formality.
- **Brands or ranges stocked.** This is what people search for: "gabor
  barneveld", "birkenstock den bosch". Brand names are the highest-intent
  search terms an independent retailer owns, and a brand list is cheap to
  maintain.
- **Sizes, fits and specialisms carried** — the "is this shop for me" fact.
  Wide fits, big sizes, children's sizing, adjustable frames, tall bikes.
- **Services attached to the goods**: fitting, repairs, alterations, servicing,
  engraving, gift wrapping. Often the actual reason to choose the independent,
  and often outsourced to a named third party — record who.
- **Phone**, for "do you have this in a 42".
- A **product collection**, if the shop maintains one. See below.

## The catalogue question

Many independents run a lookbook: photographs of stock, no cart. Before
deciding what to do with it, **establish whether it is alive** — check
`Last-Modified` on the product images, not the copyright year in the footer.
An actively maintained catalogue is a habit the shop has built, and removing it
is a change-management problem, not a design decision.

- **Alive** → migrate it as a collection (see `references/07-collections.md`)
  and mirror the existing upload loop field for field. Do not improve their
  workflow on the first pass; earn that later.
- **Dead** → propose replacing it with a brands page and a curated selection.
  A catalogue frozen three years ago actively misleads.

Either way, resist adding a cart to a business that has not asked for one.

## Page structure

Homepage:

1. `Hero` — what the shop is and who it is for, with hours status and address
   visible without scrolling
2. `HoursSummary` (bar) — open now, closing at, next open
3. `QuickLinks` — the three things people came for. Usually: the ranges, where
   to park, the specialism
4. `FeatureRow` — the specialism, told properly. This is the section that beats
   the chain
5. `CardGrid` — departments or ranges
6. `Gallery` — what the shop actually looks like inside. Reduces the risk of
   walking through an unfamiliar door
7. `FeatureRow` or `TextSection` — the shop's own story, short, linking to the
   full version
8. `MapContact` — address, parking, phone
9. `CTABand`

Other pages: one per department, a brands page (and a page per brand if the
catalogue justifies it — these rank), the specialism/service page, the story,
contact.

## Primary action

**Visit the shop.** Not a form, not a newsletter. Every design decision ranks
against "does this get someone through the door this week".

That makes three things primary, repeated throughout: the address with a route
link, the opening status right now, and the phone number. A `tel:` link
outperforms a contact form for "do you have this in my size" by a wide margin —
per the skill's judgement note, prefer the link.

## Content that earns its place

Photographs of the actual shop, inside and out, so an unfamiliar door is less
daunting. The brand list. Sizes and fits carried. The specialism, stated
plainly and early. Parking. Staff, if the shop is staff-led — in an independent
the people *are* the proposition. Honest stock language: "a selection — come in
for the full range" is both true and an invitation.

## Filler to avoid

"Kwaliteit, service en persoonlijk advies staan bij ons voorop" — every
independent retailer in the country says this and it distinguishes none of
them. Stock photography of models. A founding year in the footer doing all the
heritage work alone. Slider carousels of interior shots that no one waits
through. A newsletter signup a shop will never send. Social feed embeds that
show a post from 2019.

## Traps

- **The hours are the product.** More visits are lost to "is it open now" than
  to anything else on the site. Derive open-now, closing-soon and next-open
  rather than printing a table and hoping.
- **Koopavond and koopzondag.** A weekly late night is a rule; koopzondagen are
  dated exceptions set by the municipality, and they change annually. Never
  encode a koopzondag as a recurring rule.
- **Holiday hours are absent, not equal to normal.** Almost no retail site
  states them, and every December someone drives to a closed shop. Get the list
  and model them as exceptions.
- **Hours drift across surfaces.** Google Business Profile and Facebook both
  hold their own copy. Google's is the one most customers actually read.
  Getting the site right while GBP says something else fixes nothing — the
  handover has to name who updates all three.
- **Seasonal stock in permanent copy.** "Grote collectie pantoffels" is true in
  November and odd in June. Keep seasonal claims in the collection, not baked
  into a hero.
- **Brand lists that contradict themselves.** Menu, footer and actual stock
  drift apart over years. Reconcile them against the product data and make the
  owner choose, rather than reproducing all three.
- **Brand logos.** Nominative use for "we stock this" is normal retail
  practice, but confirm the shop has the usual supplier permission rather than
  assuming it.
- **Prices in a lookbook go stale invisibly.** If the shop shows prices without
  a cart, nothing forces them to be correct. Either commit to maintaining them
  or drop them — a wrong price is worse than no price.
- **The chain comparison is unwinnable on range.** Do not let the site compete
  on how much stock there is. It competes on fit, advice and the specific.
