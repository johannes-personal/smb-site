# Phase 3 — Facts

Facts are the things that appear in more than one place and must never disagree.
They live in singleton documents. Blocks reference them; blocks never contain
copies of them.

The test for whether something is a fact: *does it appear more than once, and
would it be wrong if the two copies disagreed?* Opening hours, yes. The headline
on the homepage, no.

Output: `content/facts.json`, validated by `scripts/validate.py`.

## Why this is the core of the skill

Every small business has the same handful of facts, expressed badly. Modelling
them properly once means:

- One edit updates the calendar page, the "open now" banner, the footer and the
  structured data Google reads
- The owner guide has one place to point at
- Local SEO works, because NAP and hours are consistent and machine-readable

Getting this right matters more than any layout decision in the project.

---

## 1. Opening hours

Almost never a flat list of seven days. Model it as a rule engine.

```jsonc
{
  "timezone": "Europe/Amsterdam",
  "seasons": [
    {
      "id": "2026",
      "label": "Seizoen 2026",
      "from": "2026-04-28",
      "to": "2026-10-24",
      "rules": [
        { "when": "schoolvakantie", "region": "midden", "days": "ma-za", "open": "10:00", "close": "17:00" },
        { "when": "default", "days": ["wo", "vr", "za"], "open": "10:00", "close": "17:00" }
      ]
    }
  ],
  "closed": [
    { "days": ["zo"], "reason": "Op zondag zijn wij gesloten" }
  ],
  "exceptions": [
    { "date": "2026-05-14", "status": "closed", "reason": "Hemelvaartsdag" },
    { "date": "2026-08-15", "open": "10:00", "close": "21:00", "reason": "Avondopenstelling" }
  ],
  "notes": "Bij extreem weer kan het park sluiten — kijk op Facebook."
}
```

Rule precedence, most specific wins: `exceptions` → `closed` → season
`schoolvakantie` rule → season `default` rule → closed.

Derive, never store separately:

- **Next open** — "Eerstvolgend open: zaterdag 1 augustus, 10.00–17.00 uur"
- **Open now** — a live status bar
- **A month calendar** for the hours page
- **`OpeningHoursSpecification`** in JSON-LD, including `validFrom`/`validThrough`
  for seasonal businesses and `specialOpeningHoursSpecification` for exceptions

Dutch school holidays vary by region (noord/midden/zuid). If a business keys its
hours to school holidays, capture the region — do not hardcode dates that will
be wrong next year. Put the dates in `facts.json` with the year attached so
their staleness is visible.

**Common trap:** a business whose "hours" are actually "by appointment" or "call
first". Model that honestly with a `mode: "appointment"` rather than inventing
opening times.

## 2. Prices

```jsonc
{
  "currency": "EUR",
  "vatIncluded": true,
  "tiers": [
    { "id": "kind", "label": "Kinderen", "amount": 7.00, "note": "0 t/m 1 jaar gratis" },
    { "id": "volwassen", "label": "Volwassenen", "amount": 5.00, "note": "inclusief koffie of thee" }
  ],
  "packages": [
    { "id": "patat", "label": "Arrangement met patat", "amount": 12.50, "includes": ["entree", "patat", "drinken"] }
  ],
  "groupDiscounts": [
    { "from": 40, "discountPercent": 10, "note": "vanaf 40 personen" }
  ],
  "externalSource": {
    "name": "Leisure King",
    "url": "https://...",
    "warning": "Prijzen staan óók in het ticketsysteem. Wijzig ze op beide plekken."
  }
}
```

Do not assume adults cost more than children — plenty of businesses price the
other way round. Read what the source actually says.

`externalSource` exists because a ticketing or ordering platform frequently
holds its own copy of prices that you cannot write to. Record it, surface the
warning in the owner guide, and prefer linking out over restating where you can.

## 3. NAP and contact

Name, address, phone — the identity trio that local search depends on. It must
match the business's Google Business Profile character for character.

```jsonc
{
  "legalName": "Speelpark & Maisdoolhof Voorthuizen",
  "tradingName": "Maisdoolhof Voorthuizen",
  "proprietor": "Fam. van Woudenbergh - Schreuder",
  "address": { "street": "Bijschoterweg 2", "postalCode": "3781 LP", "city": "Voorthuizen", "country": "NL" },
  "geo": { "lat": 52.18, "lng": 5.61 },
  "phone": "+31621338239",
  "phoneDisplay": "06-21338239",
  "email": "info@example.nl",
  "contactNote": "Bij geen gehoor kun je het beste mailen.",
  "kvk": "12345678",
  "btw": "NL001234567B01",
  "parking": "Gratis parkeren voor de deur"
}
```

Phone in E.164 for `tel:` links, plus a display form in local convention.

## 4. Services / offer

The list of what the business sells or offers. Shape varies by sector — see the
sector pack. Keep it a flat list with stable ids so blocks can reference
subsets ("show these three on the homepage") rather than duplicating them.

## 5. Socials and external profiles

Including the ones that are not links: Google Business Profile, review platforms,
and any place the business posts updates that the website does not mirror. If a
business announces closures only on Facebook, that belongs in the hours `notes`
and in the owner guide.

---

## Rules for building facts.json

1. **Never invent.** Ambiguity goes to `open-questions.md`. This is not caution
   for its own sake — a wrong price or a wrong closing time sends customers to a
   locked door.
2. **Attach provenance.** For each fact, note where it came from (which page, or
   "transcribed from JPEG", or "owner confirmed"). Transcribed and inferred facts
   get confirmed before launch.
3. **Date anything seasonal.** A season labelled `2026` makes its own staleness
   obvious next spring; one labelled "zomer" does not.
4. **Prefer one representation.** If the same fact could live in two fields,
   pick one and derive the other.

## Presenting facts at the gate

Render `facts.json` as prose and a table, not as JSON. The owner-facing summary
should be readable by the business owner, because that is who has to confirm it.
Lead with the things most likely to be wrong: hours, prices, and anything you
transcribed from an image.
