import { ChartNoAxesColumn, ChefHat, Clock, CookingPot, Users } from "lucide-react";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { IngredientIcon } from "@/components/ingredient-icon";
import { ShareBar } from "@/components/share-bar";
import { Toc } from "@/components/toc";
import { LANGS, dict, formatMinutes, type Lang } from "@/lib/i18n";
import { SITE_URL, assetPath, recipePath, recipes } from "@/lib/recipes";
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

const Chip = ({ icon: Icon, value, label }: { icon: typeof Clock; value: string; label: string }) => (
  <div className="rounded-lg bg-muted p-3 text-center">
    <Icon aria-hidden className="mx-auto size-5 text-primary" />
    <p className="font-medium">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

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
    <div className="mx-auto grid max-w-[88rem] gap-8 px-4 py-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,46rem)_minmax(0,1fr)]">
      <article className="mx-auto w-full max-w-[46rem] xl:col-start-2">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <h1 className="text-3xl font-medium leading-tight text-primary sm:text-4xl">{loc.title}</h1>
        <p className="mb-4 mt-2 text-muted-foreground">{loc.lead}</p>

        {r.hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetPath(r, r.hero)} alt={loc.title} fetchPriority="high" className="aspect-video w-full rounded-lg object-cover print:hidden" />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted text-primary print:hidden">
            <ChefHat aria-hidden className="size-10" />
            <span className="text-sm">{t.photoSoon}</span>
          </div>
        )}

        <div className="mb-8 mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Chip icon={Clock} value={formatMinutes(r.minutes)} label={t.totalTime} />
          <Chip icon={ChartNoAxesColumn} value={t[r.difficulty]} label={t.difficulty} />
          <Chip icon={Users} value={t.people(r.servings)} label={t.serves} />
          {r.pressureMinutes ? <Chip icon={CookingPot} value={`${r.pressureMinutes} min`} label={t.pressure} /> : null}
        </div>

        <section id="ingredients" aria-labelledby="ing-h" className="scroll-mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="ing-h" className="text-xl font-medium">
              {t.ingredients}
            </h2>
            <span className="print:hidden">
              <CopyButton text={ingredientsText(loc.ingredients)} label={t.copyIngredients} copiedLabel={t.copied} iconOnly />
            </span>
          </div>
          <ul>
            {loc.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-3 border-b py-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary print:hidden">
                  <IngredientIcon name={r.ingredientIcons[i]} />
                </span>
                <span>
                  {ing.text}
                  {ing.note && <span className="block text-sm text-muted-foreground">{ing.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section id="method" aria-labelledby="met-h" className="mt-10 scroll-mt-6">
          <h2 id="met-h" className="mb-4 text-xl font-medium">
            {t.method}
          </h2>
          <ol role="list" className="space-y-5">
            {loc.steps.map((text, i) => {
              const img = r.stepImages[String(i + 1)];
              return (
                <li key={i} className="relative pl-11">
                  <span aria-hidden className="absolute left-0 top-0 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    {i + 1}
                  </span>
                  <p>{text}</p>
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={assetPath(r, img)} alt={`${loc.title}, ${i + 1}`} loading="lazy" className="mt-3 aspect-video w-full rounded-lg object-cover" />
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {loc.body && (
          <div className="mt-8 space-y-3 [&_a]:text-primary [&_a]:underline [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-medium">
            <MDXRemote source={loc.body} />
          </div>
        )}

        <ShareBar url={url} title={loc.title} image={ogImage ? `${SITE_URL}${assetPath(r, ogImage)}` : undefined} t={t} />
      </article>

      <aside className="hidden xl:col-start-3 xl:block print:hidden">
        <div className="max-w-56">
          <Toc lang={lang} />
        </div>
      </aside>
    </div>
  );
}
