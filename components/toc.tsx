import { Rss } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import { dict } from "@/lib/i18n";

export function Toc({ lang }: { lang: Lang }) {
  const t = dict[lang];
  const links = [
    ["ingredients", t.ingredients],
    ["method", t.method],
    ["share", t.share],
  ];
  return (
    <nav aria-label={t.onThisRecipe} className="sticky top-6 border-l-2 pl-4 text-sm">
      <p className="mb-2 text-muted-foreground">{t.onThisRecipe}</p>
      <ul>
        {links.map(([id, label]) => (
          <li key={id}>
            <a href={`#${id}`} className="block py-1.5 hover:text-primary">
              {label}
            </a>
          </li>
        ))}
      </ul>
      <a href={`/${lang}/rss.xml`} className="mt-3 flex items-center gap-2 py-1.5 text-muted-foreground hover:text-primary">
        <Rss aria-hidden className="size-4" />
        {t.rss}
      </a>
    </nav>
  );
}
