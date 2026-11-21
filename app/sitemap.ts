import type { MetadataRoute } from "next";
import { LANGS } from "@/lib/i18n";
import { SITE_URL, recipes, routeTable } from "@/lib/recipes";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const dates = ["", ...recipes().map((r) => r.date)];
  return routeTable().flatMap((page, i) =>
    LANGS.map((l) => ({
      url: `${SITE_URL}${page[l]}`,
      lastModified: dates[i] || undefined,
      alternates: { languages: Object.fromEntries(LANGS.map((x) => [x, `${SITE_URL}${page[x]}`])) },
    })),
  );
}
