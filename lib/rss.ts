import { dict, type Lang } from "./i18n";
import { SITE_URL, recipePath, type Recipe } from "./recipes";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildRss(lang: Lang, list: Recipe[]): string {
  const d = dict[lang];
  const items = list
    .map((r) => {
      const url = `${SITE_URL}${recipePath(lang, r)}`;
      return `<item><title>${esc(r.lang[lang].title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${new Date(r.date).toUTCString()}</pubDate><description>${esc(r.lang[lang].description)}</description></item>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(d.siteName)}</title><link>${SITE_URL}/${lang}/</link><description>${esc(d.siteTagline)}</description><language>${lang}</language>${items}</channel></rss>`;
}
