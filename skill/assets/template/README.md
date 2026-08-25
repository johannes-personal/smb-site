# smb-site template

Next.js (App Router) + Puck + Supabase, deployed on Vercel.

Content is split in two:

- **facts** — singleton documents (hours, prices, NAP, services, socials).
  Edited by the owner at `/beheer`. Referenced by blocks, never copied into them.
- **pages** — one Puck JSON tree per page. Composition only. Edited at
  `/beheer/paginas/<slug>`.

## Setup

Scaffold with `python ../../scripts/scaffold.py <target-dir>` rather than
copying this folder by hand. Next.js dynamic routes use square brackets in
folder names, which skill archives reject, so they ship here as `ROUTE__*`
placeholders — the scaffold script renames them back. Routing will not work
until it has run.

1. `npm install`
2. Create a Supabase project, run `supabase/schema.sql` in the SQL editor
3. Copy `.env.example` to `.env.local` and fill it in
4. Add a Supabase auth user, open `/beheer` on the deployment and press
   **Laden**. That loads `content/*.json` into the database — no local machine
   needed. (`npm run seed` does the same if you have a checkout.)
5. `npm run dev`

## Adding a block

Blocks live in `components/blocks/` and are registered in `lib/puck.config.tsx`.
Adding one is a change to the skill's registry, not a one-off for a client —
anything the generator can produce, the owner must be able to edit.
