import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_LANG, dict, formatMinutes, isLang, pickLang, switchPath } from "@/lib/i18n";
import { assetPath, indexPath, loadRecipes, recipePath, recipes, routeTable } from "@/lib/recipes";
import { buildRss } from "@/lib/rss";
import { ingredientsText, shareTargets } from "@/lib/share";

describe("pickLang", () => {
  it.each([
    ["pt-BR,pt;q=0.9,en;q=0.8", "pt"],
    ["pt-PT", "pt"],
    ["fr-CA,fr;q=0.9", "fr"],
    ["en-US,en;q=0.9,pt;q=0.8", "en"],
    ["de,pt;q=0.5", "pt"],
    ["de,es;q=0.9", "en"],
    ["en;q=0.5,fr;q=0.9", "fr"],
    ["*", "en"],
    ["", "en"],
  ])("%s -> %s", (header, lang) => expect(pickLang(header)).toBe(lang));
  it("falls back to the default for null/undefined", () => {
    expect(pickLang(null)).toBe(DEFAULT_LANG);
    expect(pickLang(undefined)).toBe(DEFAULT_LANG);
  });
  it("isLang guards", () => {
    expect(isLang("pt")).toBe(true);
    expect(isLang("de")).toBe(false);
  });
});

describe("formatMinutes and plurals", () => {
  it("formats", () => {
    expect(formatMinutes(70)).toBe("1h10");
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(125)).toBe("2h05");
    expect(formatMinutes(45)).toBe("45 min");
  });
  it("pluralises people in every language", () => {
    expect([dict.pt.people(1), dict.pt.people(6)]).toEqual(["1 pessoa", "6 pessoas"]);
    expect([dict.en.people(1), dict.en.people(6)]).toEqual(["1 person", "6 people"]);
    expect([dict.fr.people(1), dict.fr.people(6)]).toEqual(["1 personne", "6 personnes"]);
  });
});

describe("switchPath", () => {
  const routes = routeTable();
  it("maps the same page across languages", () => {
    expect(switchPath(routes, "/pt/receitas/fricasse-missionario/", "en")).toBe("/en/recipes/missionary-fricassee/");
    expect(switchPath(routes, "/en/recipes/missionary-fricassee", "fr")).toBe("/fr/recettes/fricassee-missionnaire/");
    expect(switchPath(routes, "/pt/", "fr")).toBe("/fr/");
  });
  it("falls back to the language home for unknown pages", () => expect(switchPath(routes, "/nope/", "pt")).toBe("/pt/"));
});

describe("real content", () => {
  it("loads the recipe in every language with matching shapes", () => {
    const [r] = recipes();
    expect(r.lang.pt.title).toBe("Fricassê Missionário");
    expect(r.lang.en.title).toBe("Missionary Fricassee");
    expect(r.lang.fr.title).toBe("Fricassée Missionnaire");
    expect(recipePath("en", r)).toBe("/en/recipes/missionary-fricassee/");
    expect(indexPath("fr")).toBe("/fr/");
    expect(assetPath(r, "x.webp")).toBe("/recipes/fricasse-missionario/x.webp");
  });
  it("builds RSS with escaped content", () => {
    const [r] = recipes();
    const xml = buildRss("en", [{ ...r, lang: { ...r.lang, en: { ...r.lang.en, title: "A & <B>" } } }]);
    expect(xml).toContain("<title>A &amp; &lt;B&gt;</title>");
    expect(xml).toContain("<language>en</language>");
  });
});

describe("share helpers", () => {
  it("builds share links, with and without an image", () => {
    const t = shareTargets("https://x.test/a b", "Title & co", "https://x.test/i.jpg");
    expect(t.map((x) => x.key)).toEqual(["whatsapp", "telegram", "facebook", "x", "pinterest"]);
    expect(t[0].href).toBe("https://wa.me/?text=Title%20%26%20co%20https%3A%2F%2Fx.test%2Fa%20b");
    expect(t[4].href).toContain("media=https%3A%2F%2Fx.test%2Fi.jpg");
    expect(shareTargets("https://x.test", "T")[4].href).not.toContain("media=");
  });
  it("numbers the ingredients", () => expect(ingredientsText([{ text: "a" }, { text: "b", note: "n" }])).toBe("1. a\n2. b"));
});

describe("loadRecipes validation", () => {
  const fm = (extra = "") =>
    `---\nslug: s\ntitle: T\ndescription: D\nlead: L\ningredients:\n  - text: a\nsteps:\n  - one\n${extra}---\n`;
  const make = (mutate: (dir: string) => void, meta: object = { id: "r", date: "2026-01-01", minutes: 10, difficulty: "easy", servings: 1, ingredientIcons: ["utensils"] }) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "recipes-"));
    const dir = path.join(root, "r");
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, "recipe.json"), JSON.stringify(meta));
    for (const l of ["pt", "en", "fr"]) fs.writeFileSync(path.join(dir, `${l}.mdx`), fm());
    mutate(dir);
    return root;
  };

  it("accepts a valid recipe, string ingredients and defaults", () => {
    const root = make((d) => fs.writeFileSync(path.join(d, "en.mdx"), fm().replace("  - text: a", "  - a") + "Body"));
    const [r] = loadRecipes(root);
    expect(r.lang.en.ingredients[0]).toEqual({ text: "a" });
    expect(r.lang.en.body).toBe("Body");
    expect(r.hero).toBeNull();
  });
  it("sorts newest first", () => {
    const root = make(() => {});
    const other = path.join(root, "q");
    fs.cpSync(path.join(root, "r"), other, { recursive: true });
    fs.writeFileSync(path.join(other, "recipe.json"), JSON.stringify({ id: "q", date: "2027-01-01", minutes: 1, difficulty: "easy", servings: 1, ingredientIcons: ["utensils"] }));
    for (const l of ["pt", "en", "fr"]) fs.writeFileSync(path.join(other, `${l}.mdx`), fm().replace("slug: s", "slug: q"));
    expect(loadRecipes(root).map((r) => r.id)).toEqual(["q", "r"]);
  });
  it("ignores stray files in the content folder", () => {
    const root = make(() => {});
    fs.writeFileSync(path.join(root, "notes.txt"), "x");
    expect(loadRecipes(root)).toHaveLength(1);
  });
  it("fails on a missing language", () => expect(() => loadRecipes(make((d) => fs.rmSync(path.join(d, "fr.mdx"))))).toThrow(/fr.mdx.*missing/));
  it("fails on a missing field", () =>
    expect(() => loadRecipes(make((d) => fs.writeFileSync(path.join(d, "pt.mdx"), fm().replace("title: T\n", ""))))).toThrow(/missing "title"/));
  it("fails when ingredient counts disagree with the icons", () =>
    expect(() => loadRecipes(make((d) => fs.writeFileSync(path.join(d, "pt.mdx"), fm().replace("  - text: a", "  - text: a\n  - text: b"))))).toThrow(/exactly 1 ingredients/));
  it("fails on no steps", () =>
    expect(() => loadRecipes(make((d) => fs.writeFileSync(path.join(d, "pt.mdx"), fm().replace("  - one\n", ""))))).toThrow(/at least one step/));
  it("fails when step counts differ", () =>
    expect(() => loadRecipes(make((d) => fs.writeFileSync(path.join(d, "pt.mdx"), fm().replace("  - one\n", "  - one\n  - two\n"))))).toThrow(/same number of steps/));
  it("fails on an id that is not the folder name", () =>
    expect(() => loadRecipes(make(() => {}, { id: "zzz", ingredientIcons: [] }))).toThrow(/must equal the folder name/));
  it("fails without ingredientIcons", () => expect(() => loadRecipes(make(() => {}, { id: "r" }))).toThrow(/ingredientIcons/));
  it("fails on duplicate slugs", () => {
    const root = make(() => {});
    const other = path.join(root, "q");
    fs.cpSync(path.join(root, "r"), other, { recursive: true });
    fs.writeFileSync(path.join(other, "recipe.json"), JSON.stringify({ id: "q", date: "2025-01-01", minutes: 1, difficulty: "easy", servings: 1, ingredientIcons: ["utensils"] }));
    expect(() => loadRecipes(root)).toThrow(/duplicate slugs/);
  });
});
