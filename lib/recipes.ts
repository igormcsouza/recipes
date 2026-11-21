import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { LANGS, dict, type Lang } from "./i18n";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://recipes.igormcsouza.com.br").replace(/\/$/, "");
export const CONTENT_DIR = path.join(process.cwd(), "content", "recipes");

export type Ingredient = { text: string; note?: string };
export type Localized = {
  slug: string;
  title: string;
  description: string;
  lead: string;
  ingredients: Ingredient[];
  steps: string[];
  body: string;
};
export type Recipe = {
  id: string;
  date: string;
  minutes: number;
  pressureMinutes?: number;
  difficulty: "easy" | "medium" | "hard";
  servings: number;
  hero: string | null;
  og: string | null;
  ingredientIcons: string[];
  stepImages: Record<string, string>;
  lang: Record<Lang, Localized>;
};

function need(ok: unknown, where: string, what: string): asserts ok {
  if (!ok) throw new Error(`Recipe content error in ${where}: ${what}`);
}

function readLocalized(id: string, lang: Lang, file: string, iconCount: number): Localized {
  const where = `${id}/${lang}.mdx`;
  need(fs.existsSync(file), where, "file is missing (every recipe must exist in every language)");
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  for (const key of ["slug", "title", "description", "lead"]) need(typeof data[key] === "string" && data[key], where, `missing "${key}"`);
  need(Array.isArray(data.ingredients) && data.ingredients.length === iconCount, where, `needs exactly ${iconCount} ingredients (one per icon in recipe.json)`);
  need(Array.isArray(data.steps) && data.steps.length > 0, where, "needs at least one step");
  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    lead: data.lead,
    ingredients: data.ingredients.map((i: Ingredient | string) => (typeof i === "string" ? { text: i } : { text: i.text, note: i.note })),
    steps: data.steps,
    body: content.trim(),
  };
}

/** Reads every recipe folder. Throws (failing the build) if any language is missing or the shapes disagree. */
export function loadRecipes(dir: string = CONTENT_DIR): Recipe[] {
  const recipes = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const meta = JSON.parse(fs.readFileSync(path.join(dir, d.name, "recipe.json"), "utf8"));
      need(meta.id === d.name, d.name, `recipe.json id "${meta.id}" must equal the folder name`);
      need(Array.isArray(meta.ingredientIcons), d.name, "recipe.json needs ingredientIcons");
      const lang = Object.fromEntries(
        LANGS.map((l) => [l, readLocalized(d.name, l, path.join(dir, d.name, `${l}.mdx`), meta.ingredientIcons.length)]),
      ) as Record<Lang, Localized>;
      const stepCounts = new Set(LANGS.map((l) => lang[l].steps.length));
      need(stepCounts.size === 1, d.name, "all languages must have the same number of steps");
      return { hero: null, og: null, stepImages: {}, ...meta, lang } as Recipe;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const l of LANGS) {
    const slugs = recipes.map((r) => r.lang[l].slug);
    need(new Set(slugs).size === slugs.length, l, "duplicate slugs");
  }
  return recipes;
}

let cache: Recipe[] | undefined;
export const recipes = (): Recipe[] => (cache ??= loadRecipes());

export const indexPath = (lang: Lang) => `/${lang}/`;
export const recipePath = (lang: Lang, r: Recipe) => `/${lang}/${dict[lang].section}/${r.lang[lang].slug}/`;
export const assetPath = (r: Recipe, file: string) => `/recipes/${r.id}/${file}`;

/** One entry per page, mapping every language to that page's URL. Drives the language switcher. */
export function routeTable(list: Recipe[] = recipes()): Record<Lang, string>[] {
  const index = Object.fromEntries(LANGS.map((l) => [l, indexPath(l)])) as Record<Lang, string>;
  const pages = list.map((r) => Object.fromEntries(LANGS.map((l) => [l, recipePath(l, r)])) as Record<Lang, string>);
  return [index, ...pages];
}
