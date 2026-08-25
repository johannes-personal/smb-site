import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * Where the magic link lands. Exchanges the one-time code for a session and
 * writes it to a cookie — this is the only place a session gets created, and
 * it is a route handler precisely because route handlers may set cookies.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/beheer";

  if (!code) {
    return NextResponse.redirect(new URL("/inloggen?fout=geen-code", url.origin));
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Almost always an expired or already-used link. Say so in the URL so the
    // login page can explain rather than silently looping.
    return NextResponse.redirect(new URL("/inloggen?fout=verlopen", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
