import { ChefHat } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LANGS, dict, formatMinutes, type Lang } from "@/lib/i18n";
import { assetPath, indexPath, recipePath, recipes } from "@/lib/recipes";

type P = { params: Promise<{ lang: Lang }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: dict[lang].siteName,
    description: dict[lang].siteTagline,
    alternates: {
      canonical: indexPath(lang),
      languages: { ...Object.fromEntries(LANGS.map((l) => [l, indexPath(l)])), "x-default": indexPath("en") },
    },
  };
}

export default async function Home({ params }: P) {
  const { lang } = await params;
  const t = dict[lang];
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-medium text-primary">{t.siteName}</h1>
      <p className="mb-6 mt-1 text-muted-foreground">{t.siteTagline}</p>
      <h2 className="sr-only">{t.allRecipes}</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes().map((r) => (
          <li key={r.id}>
            <Link href={recipePath(lang, r)} className="block overflow-hidden rounded-lg border bg-card transition hover:border-primary">
              {r.hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetPath(r, r.hero)} alt="" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted text-primary">
                  <ChefHat aria-hidden className="size-10" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-medium">{r.lang[lang].title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatMinutes(r.minutes)} · {t.people(r.servings)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
