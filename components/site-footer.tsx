import Link from "next/link";
import { dict, type Lang } from "@/lib/i18n";
import { indexPath } from "@/lib/recipes";

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = dict[lang];
  return (
    <footer className="mt-12 border-t bg-muted print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} Igor Souza. {t.footer}
        </p>
        <nav aria-label={t.siteName} className="flex gap-4">
          <Link href={indexPath(lang)} className="inline-flex min-h-11 items-center hover:text-foreground">
            {t.home}
          </Link>
          <a href={`/${lang}/rss.xml`} className="inline-flex min-h-11 items-center hover:text-foreground">
            {t.rss}
          </a>
        </nav>
      </div>
    </footer>
  );
}
