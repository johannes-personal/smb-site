import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { publishableKey, supabaseUrl } from "./supabase";

/**
 * Server client that can read — and, where Next allows it, write — the session
 * cookie. Use this for anything that needs to know who is signed in.
 *
 * `setAll` silently does nothing when called from a server component, because
 * Next forbids setting cookies during render. That is expected: the session is
 * written by the auth callback route and by the browser client, both of which
 * can set cookies. Without the try/catch, a token refresh during render would
 * throw and take the page down.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), publishableKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a server component — the callback route handles it.
        }
      },
    },
  });
}

/** The signed-in user, or null. */
export async function getUser() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
