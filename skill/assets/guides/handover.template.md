<!--
Template for docs/handover.md. Fill in real values, not placeholders — this is
the document that determines whether the site still works in three years.
Ask these questions in Phase 0, not on launch day.
-->

# Overdracht en beheer

## Domeinnaam
- Domein: {{domain}}
- Geregistreerd bij: {{registrar}}
- Account staat op naam van: {{domain_owner}}
- Verloopt op: {{expiry}} — wie betaalt: {{who_pays}}

## E-mail
- E-mail wordt gehost door: {{email_host}}
- **De MX-records van dit domein mogen nooit gewijzigd worden bij werk aan de
  website.** Het aanpassen van de website raakt alleen de A/CNAME-records.

## Hosting (Vercel)
- Account: {{vercel_owner}} · Project: {{vercel_project}}

## Content (Supabase)
- Account: {{supabase_owner}} · Project: {{supabase_ref}}

## Externe koppelingen
<!-- One row per entry from harvest/embeds.md. -->

| Wat | Waarvoor | Account bij | Wat gebeurt er als het vervalt |
|---|---|---|---|
| {{integration}} | {{purpose}} | {{account_owner}} | {{consequence}} |

## Google-bedrijfsprofiel
- Beheerd door: {{gbp_owner}}

## Als u de toegang kwijtraakt
{{recovery_steps}}

## Voor een volgende ontwikkelaar
- Code: {{repo_url}}
- Stack: Next.js (App Router) + Puck + Supabase, gehost op Vercel
- Inhoud staat in twee tabellen: `facts` (gegevens die op meerdere plekken
  terugkomen) en `pages` (de indeling per pagina, als Puck-JSON). Blokken
  verwijzen naar facts en bevatten er nooit een kopie van.
- Blokken toevoegen gebeurt in `components/blocks/` en `lib/puck.config.tsx`.
