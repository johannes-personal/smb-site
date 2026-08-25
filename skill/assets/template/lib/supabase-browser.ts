"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client for the owner area.
 *
 * Deliberately `@supabase/ssr`'s client rather than plain `supabase-js`: this
 * one stores the session in **cookies**, which is what makes the server able to
 * see it. The plain client keeps the session in localStorage, where a server
 * component and an API route cannot reach it — so every write would be
 * rejected as "not signed in" while the browser believed it was logged in.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
