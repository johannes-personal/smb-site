"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export function SignOut() {
  const router = useRouter();
  return (
    <button
      className="underline"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Uitloggen
    </button>
  );
}
