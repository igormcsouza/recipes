export const LANGS = ["pt", "en", "fr"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

export const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);

/** Best supported language from an Accept-Language header. pt-PT falls to pt, anything unknown to en. */
export function pickLang(header: string | null | undefined): Lang {
  const ranked = (header ?? "")
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { primary: tag.toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) : 1, i };
    })
    .filter((x) => x.primary)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  const hit = ranked.find((x) => isLang(x.primary));
  return hit ? (hit.primary as Lang) : DEFAULT_LANG;
}

export type Dict = {
  siteName: string;
  siteTagline: string;
  section: string;
  home: string;
  skip: string;
  settings: string;
  language: string;
  theme: string;
  system: string;
  light: string;
  dark: string;
  totalTime: string;
  difficulty: string;
  easy: string;
  medium: string;
  hard: string;
  serves: string;
  people: (n: number) => string;
  pressure: string;
  ingredients: string;
  method: string;
  share: string;
  shareThis: string;
  copyIngredients: string;
  copied: string;
  copyLink: string;
  print: string;
  onThisRecipe: string;
  allRecipes: string;
  photoSoon: string;
  footer: string;
  rss: string;
  opensInNewTab: string;
};

export const dict: Record<Lang, Dict> = {
  pt: {
    siteName: "Receitas do Igor Souza",
    siteTagline: "Comida de casa, sem frescura.",
    section: "receitas",
    home: "Início",
    skip: "Ir para o conteúdo",
    settings: "Ajustes",
    language: "Idioma",
    theme: "Tema",
    system: "Sistema",
    light: "Claro",
    dark: "Escuro",
    totalTime: "Tempo total",
    difficulty: "Dificuldade",
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
    serves: "Serve",
    people: (n) => `${n} ${n === 1 ? "pessoa" : "pessoas"}`,
    pressure: "Panela de pressão",
    ingredients: "Ingredientes",
    method: "Modo de preparo",
    share: "Compartilhar",
    shareThis: "Compartilhe esta receita",
    copyIngredients: "Copiar ingredientes",
    copied: "Copiado",
    copyLink: "Copiar link",
    print: "Imprimir",
    onThisRecipe: "Nesta receita",
    allRecipes: "Todas as receitas",
    photoSoon: "Foto em breve",
    footer: "Receitas feitas e testadas em casa.",
    rss: "RSS",
    opensInNewTab: "abre em nova aba",
  },
  en: {
    siteName: "Igor Souza's Recipes",
    siteTagline: "Home cooking, no fuss.",
    section: "recipes",
    home: "Home",
    skip: "Skip to content",
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    system: "System",
    light: "Light",
    dark: "Dark",
    totalTime: "Total time",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    serves: "Serves",
    people: (n) => `${n} ${n === 1 ? "person" : "people"}`,
    pressure: "Pressure cooker",
    ingredients: "Ingredients",
    method: "Method",
    share: "Share",
    shareThis: "Share this recipe",
    copyIngredients: "Copy ingredients",
    copied: "Copied",
    copyLink: "Copy link",
    print: "Print",
    onThisRecipe: "In this recipe",
    allRecipes: "All recipes",
    photoSoon: "Photo coming soon",
    footer: "Recipes cooked and tested at home.",
    rss: "RSS",
    opensInNewTab: "opens in a new tab",
  },
  fr: {
    siteName: "Recettes d'Igor Souza",
    siteTagline: "Cuisine maison, sans chichi.",
    section: "recettes",
    home: "Accueil",
    skip: "Aller au contenu",
    settings: "Réglages",
    language: "Langue",
    theme: "Thème",
    system: "Système",
    light: "Clair",
    dark: "Sombre",
    totalTime: "Temps total",
    difficulty: "Difficulté",
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
    serves: "Pour",
    people: (n) => `${n} ${n === 1 ? "personne" : "personnes"}`,
    pressure: "Cocotte-minute",
    ingredients: "Ingrédients",
    method: "Préparation",
    share: "Partager",
    shareThis: "Partager cette recette",
    copyIngredients: "Copier les ingrédients",
    copied: "Copié",
    copyLink: "Copier le lien",
    print: "Imprimer",
    onThisRecipe: "Dans cette recette",
    allRecipes: "Toutes les recettes",
    photoSoon: "Photo bientôt",
    footer: "Recettes cuisinées et testées à la maison.",
    rss: "RSS",
    opensInNewTab: "s'ouvre dans un nouvel onglet",
  },
};

/** 70 -> "1h10", 60 -> "1h", 45 -> "45 min". */
export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;
  const m = total % 60;
  return `${Math.floor(total / 60)}h${m ? String(m).padStart(2, "0") : ""}`;
}

/** Where the language switcher should send the reader: the same page in `to`, else that language's home. */
export function switchPath(routes: Record<Lang, string>[], pathname: string, to: Lang): string {
  const here = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const page = routes.find((r) => LANGS.some((l) => r[l] === here));
  return page ? page[to] : `/${to}/`;
}
