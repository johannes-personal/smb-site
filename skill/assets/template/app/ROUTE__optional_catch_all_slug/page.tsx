import { notFound } from "next/navigation";
import { Render } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { getFacts } from "@/lib/facts";
import { buildConfig, SiteHeader, SiteFooter } from "@smb-site/engine";
import { createServerClient } from "@/lib/supabase";
import { getCatalogue } from "@/lib/collections";

// SSR-capable by default even where output is effectively static. Choosing
// static-only forecloses live preview and anything transactional later, and
// retrofitting it is an architecture migration rather than a config change.
//
// force-dynamic rather than a revalidate window: content lives in Supabase, so
// prerendering at build time would need database credentials during the build
// and would serve whatever was in the database when the deploy ran. Pages are
// cheap to render and the publish route revalidates explicitly.
export const dynamic = "force-dynamic";

async function getPage(slug: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("pages")
    .select("data, title")
    .eq("site_id", process.env.NEXT_PUBLIC_SITE_ID ?? "default")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data;
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const path = slug?.join("/") ?? "";

  const [page, facts] = await Promise.all([getPage(path || "home"), getFacts()]);

  // Where a project gives a collection its own URLs, resolve them here — after
  // the page lookup, so a Puck page always wins at a given slug and the owner
  // can add a page anywhere without a route collision.
  // See references/07-collections.md.
  if (!page) notFound();

  // Blocks that show a collection need it resolved before render: Puck renders
  // synchronously, so a block cannot fetch for itself. Empty when the project
  // defines no collections.
  const catalogue = await getCatalogue();

  return (
    <>
      <SiteHeader facts={facts} />
      <Render config={buildConfig(facts, catalogue)} data={page.data} />
      <SiteFooter facts={facts} />
    </>
  );
}
