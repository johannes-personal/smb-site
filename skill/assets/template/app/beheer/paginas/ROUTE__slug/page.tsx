import { getFacts } from "@/lib/facts";
import { createServerClient } from "@/lib/supabase";
import { PageEditor } from "./PageEditor";

export const dynamic = "force-dynamic";

/** "Pagina's" — the canvas. Used rarely, but its absence is exactly what makes
 *  a rigid CMS feel like a dead end to an owner who wants to add a section. */
export default async function EditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createServerClient();
  const [{ data: page }, facts] = await Promise.all([
    supabase
      .from("pages")
      .select("data, title")
      .eq("site_id", process.env.NEXT_PUBLIC_SITE_ID ?? "default")
      .eq("slug", slug)
      .single(),
    getFacts(),
  ]);

  return <PageEditor slug={slug} initialData={page?.data} facts={facts} />;
}
