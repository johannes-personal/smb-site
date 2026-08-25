# Phase 6 — Guides and handover

Three documents, each with a different reader. The first two are the actual
deliverable to the business; the third is for whoever maintains the site next.

Write the owner-facing documents **in the owner's language** (Dutch for NL
clients) and generate them from the real schema and page list, so they cannot
describe a field that does not exist.

## 1. `docs/handleiding.md` — the owner guide

Task-based, not feature-based. Nobody wants to learn a CMS; they want to change
their opening hours before the season starts.

Structure:

```
# Handleiding voor uw website

## In het kort
   - Twee plekken: "Mijn gegevens" en "Pagina's"
   - 95% van wat u wilt aanpassen zit in "Mijn gegevens"

## Inloggen
   - Ga naar <url>/beheer, vul uw e-mailadres in, klik op de link in uw mail.
   - Er is geen wachtwoord. U kunt er dus ook geen vergeten.

## Mijn gegevens (dit gebruikt u het vaakst)
   One short section per fact that actually exists on this site:
   - Openingstijden aanpassen
   - Een uitzondering toevoegen (feestdag, extra open, gesloten dag)
   - Prijzen aanpassen
   - Telefoonnummer of adres aanpassen

## Pagina's (voor grotere wijzigingen)
   - Een blok toevoegen, verplaatsen of verwijderen
   - Foto's vervangen
   - Tekst aanpassen
   - Publiceren

## Wat u beter niet zelf doet
   Honest, specific, and short. Include anything that would break the site
   or diverge from an external system.

## Als er iets misgaat
   - De site is offline
   - Ik kan niet inloggen
   - Ik heb per ongeluk iets weggegooid
   - Wie belt u
```

Rules that make these guides usable:

- One task per section, with the exact button labels from the real interface.
- Say what will happen after each step, so the reader knows it worked.
- Where a fact appears in several places, say so explicitly: *"U past de prijs
  op één plek aan. Hij verandert dan overal op de site vanzelf."* This is
  reassurance and it is also true, which is why the architecture matters.
- Where a fact is duplicated in an external system you cannot control (a
  ticketing platform, an ordering site), warn plainly and name both places.
- No jargon. Not "CMS", not "publiceren naar productie", not "deploy".

## 2. `docs/handover.md` — ownership and recovery

The part that determines whether this site still works in three years. Fill in
real values, not placeholders.

- **Domain**: registrar, who holds the account, expiry date, who pays
- **Email**: where it is hosted — and a line stating that website changes must
  never touch MX records
- **Vercel**: account owner, project name
- **Supabase**: account owner, project ref
- **Third-party integrations** from `harvest/embeds.md`: what each is, who owns
  the login, what breaks if it lapses
- **Google Business Profile**: who has access
- **Recovery**: what to do if the owner loses access to each of the above
- **If the developer disappears**: where the code is, what stack it is, what a
  new developer needs to know in one paragraph

Ask these questions in Phase 0. Discovering on launch day that nobody knows who
registered the domain is common and entirely avoidable.

## 3. `docs/developer-setup.md`

Generated from what actually needed setting up on this project, not a generic
template. Environment variables, the Supabase project, seeding, how to run the
editor locally, how to add a redirect, and where the content lives.

Keep it honest about what is not automated.

## Before you hand over

Sit with the guide and try the three tasks the owner is most likely to do, using
only the guide. If any step needs knowledge that is not in the document, the
document is wrong.
