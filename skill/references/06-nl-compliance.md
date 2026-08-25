# NL compliance checklist

Applies to Dutch businesses. Adapt for other jurisdictions; the shape of the
checklist transfers even where the specifics do not.

This is a practical checklist, not legal advice. Where a client's situation is
unusual — regulated professions, alcohol sales, children's data — say so and
suggest they check with their own adviser rather than guessing.

## Identity details

Required on the site of a business trading in the Netherlands:

- Trading name and legal name where they differ
- Visiting or correspondence address
- Email address and/or phone
- **KvK number** — always
- **BTW identification number** — required for **distance selling** (a webshop,
  or taking orders by phone or email), not for a business whose customers come
  to the premises. For a sole trader it is a number worth not publishing
  without a reason, so do not add it by default: establish first whether the
  business sells at a distance
- For regulated professions: relevant registration and supervisory body

Put these in the footer and on the contact page, sourced from `facts.nap` so
they appear once in the data.

## Cookies and AVG

The simplest compliant site is one that sets no non-functional cookies at all,
and that is achievable here:

- Vercel Web Analytics is cookieless — no consent banner needed
- Do not add Google Analytics unless the client genuinely needs it. If they
  insist, they need a consent banner with a real reject option, and consent must
  be given before any tracking loads
- **Embedded third parties often set cookies you did not choose.** A booking
  widget, a maps embed or a social feed can pull consent obligations back in.
  Check what each embed from Phase 2 actually loads, and prefer a static map
  image plus a link over a live map embed where the map is decorative
- If a contact form exists, say what happens to the data and for how long

A privacy statement is required as soon as personal data is processed — which
includes a contact form or a mailing list. Keep it short and truthful.

## Consumer law, where the site sells anything

- Prices shown to consumers include BTW
- Terms and conditions accessible before purchase
- The 14-day right of withdrawal applies to most distance selling, **but there
  are exemptions** — notably services tied to a specific date or period, which
  covers dated event tickets, and accommodation, transport and catering booked
  for a specific date. Getting this wrong in either direction causes problems:
  claiming a right that does not exist confuses customers, and denying one that
  does exist is unlawful
- Where the sale happens on an external platform, its terms govern the sale —
  do not restate them on the site, link to them

## Accessibility

Private businesses are not bound by the public-sector accessibility rules, but
the baseline in `references/04-design-system.md` is cheap and there is
increasing regulatory pressure across the EU. Meet it anyway.

## Images and content rights

- The business owns the text from its own old site — reuse freely
- It may **not** own the photographs on that site. Old developers frequently
  used stock images under a licence that ended with them. Flag anything that
  looks like stock in Phase 2 and get confirmation before reusing it
- Photographs of identifiable people, especially children, need consent — very
  relevant for anything family-oriented. Ask before reusing crowd shots

## Before launch

- [ ] KvK and BTW present and correct
- [ ] Privacy statement present if any personal data is processed
- [ ] Terms linked if anything is sold
- [ ] No non-functional cookies without consent, embeds included
- [ ] Image rights confirmed
- [ ] Prices shown include BTW
- [ ] Withdrawal-right statement correct for what is actually sold
