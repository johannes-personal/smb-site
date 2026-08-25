import { createClient } from "@supabase/supabase-js";

// Supabase replaced the JWT-based `anon` / `service_role` keys with
// publishable (`sb_publishable_…`) and secret (`sb_secret_…`) keys. The legacy
// pair keeps working until the end of 2026, so both are accepted here — but a
// site handed to an owner will outlive that date, and nobody will remember why
// it broke. Prefer the new names; fall back so an existing deployment does not
// go dark mid-migration.
//
// Secret keys also refuse to run from a browser (the platform matches on
// User-Agent), which is a real safety net for the one key that bypasses RLS.

function required(names: [string, string], hint: string): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(
    `${names[0]} ontbreekt (of het oude ${names[1]}). ${hint} — zie docs/developer-setup.md.`
  );
}

function url(): string {
  return required(
    ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"],
    "Te vinden in Supabase onder Project Settings → API"
  );
}

/** Low-privilege key. Safe in the browser; RLS decides what it can see. */
function publishableKey(): string {
  return required(
    ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    "De publishable key (sb_publishable_…)"
  );
}

/** Bypasses row level security entirely. Server-side only — never import a
 *  module that calls this into a client component, and never give it a
 *  NEXT_PUBLIC_ prefix. */
function secretKey(): string {
  return required(
    ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    "De secret key (sb_secret_…)"
  );
}

export { publishableKey, secretKey, url as supabaseUrl };

/** Read-only client for rendering. Anonymous read of published rows is
 *  permitted by RLS; nothing here can write. */
export function createServerClient() {
  return createClient(url(), publishableKey(), { auth: { persistSession: false } });
}

// No browser client here on purpose. A client built from plain supabase-js
// keeps its session in localStorage, which the server cannot read — the browser
// would look signed in while every server check disagreed, and any call needing
// the `authenticated` role (a storage upload, for instance) would be refused by
// policy with nothing to explain why. The browser client lives in
// lib/supabase-browser.ts and is built on @supabase/ssr, which uses cookies.

/** Service-role client. Server-side only, never imported into a client
 *  component. Used by the publish route and the seed script. */
export function createAdminClient() {
  return createClient(url(), secretKey(), { auth: { persistSession: false } });
}
