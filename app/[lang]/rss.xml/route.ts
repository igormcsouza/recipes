import { LANGS, isLang } from "@/lib/i18n";
import { recipes } from "@/lib/recipes";
import { buildRss } from "@/lib/rss";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) return new Response("Not found", { status: 404 });
  return new Response(buildRss(lang, recipes()), { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
