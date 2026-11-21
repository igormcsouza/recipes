import { ArrowLeft, ChartNoAxesColumn, ChefHat, Clock, CookingPot, Users } from "lucide-react";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { IngredientList } from "@/components/ingredient-list";
import { ShareBar } from "@/components/share-bar";
import { LANGS, dict, formatMinutes, type Lang } from "@/lib/i18n";
import { SITE_URL, assetPath, indexPath, recipePath, recipes } from "@/lib/recipes";
import { ingredientsText } from "@/lib/share";

type P = { params: Promise<{ lang: Lang; section: string; slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () =>
  LANGS.flatMap((lang) => recipes().map((r) => ({ lang, section: dict[lang].section, slug: r.lang[lang].slug })));

async function find({ params }: P) {
  const { lang, slug } = await params;
  const recipe = recipes().find((r) => r.lang[lang].slug === slug);
  if (!recipe) notFound();
  return { lang, recipe, loc: recipe.lang[lang] };
}

export async function generateMetadata(p: P): Promise<Metadata> {
  const { lang, recipe, loc } = await find(p);
  const image = recipe.og ?? recipe.hero;
  return {
    title: loc.title,
    description: loc.description,
    alternates: {
      canonical: recipePath(lang, recipe),
      languages: { ...Object.fromEntries(LANGS.map((l) => [l, recipePath(l, recipe)])), "x-default": recipePath("en", recipe) },
    },
    openGraph: { type: "article", title: loc.title, description: loc.description, locale: lang, images: image ? [assetPath(recipe, image)] : undefined },
    twitter: { card: "summary_large_image" },
  };
}

const Stat = ({ icon: Icon, value, label }: { icon: typeof Clock; value: string; label: string }) => (
  <div className="flex items-center gap-3 bg-card p-4 min-[720px]:gap-3.5 min-[720px]:px-6 min-[720px]:py-[22px]">
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-soft text-primary min-[720px]:size-11">
      <Icon aria-hidden className="size-5" />
    </span>
    <div>
      <p className="font-serif text-[21px] font-semibold leading-[1.1] min-[720px]:text-[26px]">{value}</p>
      <p className="text-[13px] text-muted-foreground min-[720px]:text-sm">{label}</p>
    </div>
  </div>
);

const h2 = "font-serif text-[28px] font-semibold tracking-tight min-[720px]:text-[30px]";

export default async function RecipePage(p: P) {
  const { lang, recipe: r, loc } = await find(p);
  const t = dict[lang];
  const url = `${SITE_URL}${recipePath(lang, r)}`;
  const ogImage = r.og ?? r.hero;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: loc.title,
    description: loc.description,
    inLanguage: lang,
    author: { "@type": "Person", name: "Igor Souza" },
    datePublished: r.date,
    image: ogImage ? [`${SITE_URL}${assetPath(r, ogImage)}`] : undefined,
    totalTime: `PT${Math.floor(r.minutes / 60)}H${r.minutes % 60}M`,
    recipeYield: String(r.servings),
    recipeIngredient: loc.ingredients.map((i) => i.text),
    recipeInstructions: loc.steps.map((text) => ({ "@type": "HowToStep", text })),
  };

  return (
    <article className="mx-auto w-full max-w-[1120px] px-5 pt-1 min-[720px]:px-8 min-[720px]:pt-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link
        href={indexPath(lang)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-card py-2.5 pl-3.5 pr-[18px] text-[15px] font-medium transition hover:bg-muted print:hidden"
      >
        <ArrowLeft aria-hidden className="size-[18px]" />
        {t.allRecipes}
      </Link>

      <header className="flex flex-col gap-3.5 py-6 min-[720px]:gap-5 min-[720px]:py-9">
        <h1 className="max-w-[860px] font-serif text-[44px] font-semibold leading-[1.02] tracking-[-0.03em] min-[720px]:text-[72px] min-[720px]:leading-none">{loc.title}</h1>
        <p className="max-w-[680px] text-lg leading-[1.55] text-muted-foreground min-[720px]:text-[21px]">{loc.lead}</p>
      </header>

      {r.hero ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={assetPath(r, r.hero)} alt={loc.title} fetchPriority="high" className="h-60 w-full rounded-[28px] object-cover print:hidden min-[720px]:h-[440px] min-[720px]:rounded-[36px]" />
      ) : (
        <div className="relative grid h-60 place-items-center overflow-hidden rounded-[28px] bg-tile print:hidden min-[720px]:h-[440px] min-[720px]:rounded-[36px]">
          <div className="absolute -right-[50px] -top-[60px] size-[200px] rounded-full bg-tile-2 min-[720px]:-right-20 min-[720px]:-top-[90px] min-[720px]:size-[340px]" />
          <div className="absolute -bottom-[70px] -left-10 size-40 rounded-full bg-tile-2 opacity-60 min-[720px]:-bottom-[110px] min-[720px]:-left-[60px] min-[720px]:size-[280px]" />
          <div className="relative grid size-[88px] place-items-center rounded-full bg-card text-primary shadow-float min-[720px]:size-[120px]">
            <ChefHat aria-hidden className="size-10 min-[720px]:size-14" strokeWidth={1.75} />
          </div>
          <span className="absolute bottom-3.5 left-3.5 rounded-full bg-card px-3.5 py-1.5 text-[13px] font-medium min-[720px]:bottom-5 min-[720px]:left-5 min-[720px]:px-4 min-[720px]:py-2 min-[720px]:text-sm">
            {t.photoSoon}
          </span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border bg-border min-[720px]:mt-5 min-[720px]:grid-cols-4 min-[720px]:rounded-[28px]">
        <Stat icon={Clock} value={formatMinutes(r.minutes)} label={t.totalTime} />
        <Stat icon={ChartNoAxesColumn} value={t[r.difficulty]} label={t.difficulty} />
        <Stat icon={Users} value={t.people(r.servings)} label={t.serves} />
        {r.pressureMinutes ? <Stat icon={CookingPot} value={`${r.pressureMinutes} min`} label={t.pressure} /> : null}
      </div>

      <div className="flex flex-wrap items-start gap-x-14 gap-y-9 pt-8 min-[720px]:pt-14">
        <section
          id="ingredients"
          aria-labelledby="ing-h"
          className="w-full scroll-mt-6 rounded-[28px] border bg-card px-5 pb-2 pt-[22px] min-[720px]:max-w-[430px] min-[720px]:flex-[1_1_360px] min-[720px]:rounded-[32px] min-[720px]:px-7 min-[720px]:pb-3 min-[720px]:pt-7 min-[720px]:shadow-float"
        >
          <div className="flex items-center justify-between pb-1.5 min-[720px]:pb-2">
            <h2 id="ing-h" className={h2}>
              {t.ingredients}
            </h2>
            <span className="print:hidden">
              <CopyButton text={ingredientsText(loc.ingredients)} label={t.copyIngredients} copiedLabel={t.copied} />
            </span>
          </div>
          <IngredientList items={loc.ingredients} />
        </section>

        <section id="method" aria-labelledby="met-h" className="min-w-0 flex-[999_1_480px] scroll-mt-6">
          <h2 id="met-h" className={`${h2} mb-1 min-[720px]:mb-2`}>
            {t.method}
          </h2>
          <ol role="list">
            {loc.steps.map((text, i) => {
              const img = r.stepImages[String(i + 1)];
              return (
                <li key={i} className={`flex gap-4 border-b py-[18px] last:border-b-0 min-[720px]:gap-5 min-[720px]:py-[22px] ${img ? "items-start" : "items-center"}`}>
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-soft font-serif text-xl font-semibold text-primary min-[720px]:size-12 min-[720px]:text-[22px]"
                  >
                    {i + 1}
                  </span>
                  <div className={`min-w-0 flex-1 ${img ? "pt-2 min-[720px]:pt-2.5" : ""}`}>
                    <p className="text-[17px] leading-[1.6] min-[720px]:text-[19px]">{text}</p>
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={assetPath(r, img)} alt={`${loc.title}, ${i + 1}`} loading="lazy" className="mt-3 aspect-video w-full rounded-3xl object-cover" />
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      {loc.body && (
        <div className="mt-8 max-w-[680px] space-y-3 text-[17px] leading-[1.6] [&_a]:text-primary [&_a]:underline [&_h2]:mt-6 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold">
          <MDXRemote source={loc.body} />
        </div>
      )}

      <ShareBar url={url} title={loc.title} image={ogImage ? `${SITE_URL}${assetPath(r, ogImage)}` : undefined} t={t} />
    </article>
  );
}
