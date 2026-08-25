"use client";

import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { buildConfig } from "@smb-site/engine";
import type { Facts } from "@/lib/facts";

export function PageEditor({ slug, initialData, facts }: { slug: string; initialData?: Data; facts: Facts }) {
  const config = buildConfig(facts);

  async function publish(data: Data) {
    await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "page", slug, data }),
    });
  }

  return (
    <Puck
      config={config}
      data={initialData ?? { content: [], root: {} }}
      onPublish={publish}
      // The owner should be able to rearrange the site without being able to
      // make it ugly. Three things enforce that, and it is worth being precise
      // about which does what:
      //
      //  - The header and footer are rendered outside <Render> entirely, so
      //    they never appear on this canvas. They hold the address and phone
      //    number and must be on every page.
      //  - The page root is locked in puck.config.tsx — no root fields, no
      //    root editing.
      //  - Fact-driven blocks cannot be duplicated, also in puck.config.tsx.
      //
      // What is left is these four verbs, over blocks whose fields are enums
      // and references rather than free CSS.
      permissions={{ drag: true, duplicate: true, delete: true, edit: true }}
      iframe={{ enabled: true }}
    />
  );
}
