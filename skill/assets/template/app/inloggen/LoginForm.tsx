"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Back to this deployment, whichever one the owner is on — a preview
          // and production must not send people to each other.
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/beheer`,
        },
      });
      if (error) throw new Error(error.message);
      setState("sent");
    } catch (err) {
      setState("error");
      setMessage((err as Error).message);
    }
  }

  if (state === "sent") {
    return (
      <p role="status" className="mt-8 rounded-(--radius-soft) bg-green-50 p-4">
        Er is een e-mail onderweg naar <strong>{email}</strong>. Klik op de link erin, dan
        bent u ingelogd. De link is een kwartier geldig. Niets ontvangen? Kijk even in uw
        map met ongewenste e-mail.
      </p>
    );
  }

  return (
    <form onSubmit={send} className="mt-8">
      <label className="block">
        <span className="block text-sm font-medium">E-mailadres</span>
        <input
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded border border-black/20 p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={state === "busy"}
        className="mt-4 rounded-(--radius-soft) bg-(--color-brand) px-6 py-3 font-medium text-(--color-brand-ink) disabled:opacity-40"
      >
        {state === "busy" ? "Bezig…" : "Stuur mij een inloglink"}
      </button>
      {message && (
        <p role="status" className="mt-4 rounded bg-amber-50 p-3 text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
