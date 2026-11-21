import { ArrowRight, ChefHat, Clock, Users } from "lucide-react";
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

const pill = "self-start rounded-full bg-soft font-medium text-primary";

export default async function Home({ params }: P) {
  const { lang } = await params;
  const t = dict[lang];
  const list = recipes();
  const [lead, ...rest] = t.siteTagline.split(/,\s*/);
  return (
    <div className="mx-auto w-full max-w-[1120px] px-5 min-[720px]:px-8">
      <section className="flex flex-wrap items-center justify-between gap-8 pb-8 pt-6 min-[720px]:pb-14 min-[720px]:pt-14">
        <div className="flex flex-1 basis-[560px] flex-col gap-6">
          <span className={`${pill} px-4 py-2 text-sm`}>{t.cooked}</span>
          <h1 className="max-w-[760px] font-serif text-[52px] font-semibold leading-none tracking-[-0.03em] min-[720px]:text-[84px]">
            {rest.length ? `${lead}, ` : null}
            <span className="text-primary">{rest.length ? rest.join(", ") : lead}</span>
          </h1>
        </div>
        <div aria-hidden className="relative hidden h-60 w-[300px] shrink-0 min-[720px]:block">
          <div className="absolute left-[70px] top-0 grid size-[210px] place-items-center rounded-full bg-tile-2 text-tile-foreground">
            <ChefHat className="size-[84px]" strokeWidth={1.5} />
          </div>
          <div className="absolute left-0 top-[120px] size-28 rounded-full bg-primary" />
          <div className="absolute left-[214px] top-40 size-16 rounded-full bg-soft" />
        </div>
      </section>

      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-serif text-[30px] font-semibold tracking-tight">{t.allRecipes}</h2>
        <span className="text-[15px] text-muted-foreground">{t.recipeCount(list.length)}</span>
      </div>

      <ul className="flex flex-col gap-6">
        {list.map((r, i) => (
          <li key={r.id}>
            <Link
              href={recipePath(lang, r)}
              className="group flex flex-wrap rounded-[28px] border bg-card p-3 shadow-float transition duration-200 hover:-translate-y-1 min-[720px]:rounded-[36px]"
            >
              {r.hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetPath(r, r.hero)} alt="" className="min-h-[260px] flex-1 basis-[420px] rounded-3xl object-cover min-[720px]:min-h-[360px] min-[720px]:rounded-[26px]" />
              ) : (
                <div className="relative grid min-h-[260px] flex-1 basis-[420px] place-items-center overflow-hidden rounded-3xl bg-tile min-[720px]:min-h-[360px] min-[720px]:rounded-[26px]">
                  <div className="absolute -right-[60px] -top-[60px] size-60 rounded-full bg-tile-2" />
                  <div className="absolute -bottom-[70px] -left-10 size-[200px] rounded-full bg-tile-2 opacity-60" />
                  <div className="relative grid size-[104px] place-items-center rounded-full bg-card text-primary shadow-float">
                    <ChefHat aria-hidden className="size-12" strokeWidth={1.75} />
                  </div>
                </div>
              )}
              <div className="flex flex-1 basis-[380px] flex-col justify-center gap-[18px] p-6 min-[720px]:p-10">
                {i === 0 && <span className={`${pill} px-3.5 py-1.5 text-[13px] font-semibold`}>{t.latest}</span>}
                <h3 className="font-serif text-4xl font-semibold leading-[1.05] tracking-[-0.025em] min-[720px]:text-[46px]">{r.lang[lang].title}</h3>
                <p className="text-lg leading-[1.6] text-muted-foreground">{r.lang[lang].lead}</p>
                <div className="flex flex-wrap gap-5 text-[15px] text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Clock aria-hidden className="size-[18px]" />
                    {formatMinutes(r.minutes)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Users aria-hidden className="size-[18px]" />
                    {t.people(r.servings)}
                  </span>
                </div>
                <span className="mt-2 inline-flex items-center gap-2.5 self-start rounded-full bg-primary px-7 py-4 text-base font-semibold text-primary-foreground transition-[gap] duration-200 group-hover:gap-3.5">
                  {t.cook}
                  <ArrowRight aria-hidden className="size-[18px]" strokeWidth={2.25} />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
