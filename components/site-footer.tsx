import Link from "next/link";
import { dict, type Lang } from "@/lib/i18n";
import { indexPath } from "@/lib/recipes";

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = dict[lang];
  const link = "inline-flex min-h-11 items-center hover:text-foreground";
  return (
    <footer className="mx-5 mt-10 flex flex-col gap-3 border-t pb-8 pt-6 text-sm text-muted-foreground print:hidden min-[720px]:mx-auto min-[720px]:mt-[72px] min-[720px]:w-full min-[720px]:max-w-[1120px] min-[720px]:flex-row min-[720px]:flex-wrap min-[720px]:items-center min-[720px]:justify-between min-[720px]:gap-4 min-[720px]:p-8 min-[720px]:text-[15px]">
      <p>
        &copy; {new Date().getFullYear()} Igor Souza. {t.footer}
      </p>
      <nav aria-label={t.siteName} className="flex gap-5 min-[720px]:gap-6">
        <Link href={indexPath(lang)} className={link}>
          {t.home}
        </Link>
        <a href={`/${lang}/rss.xml`} className={link}>
          {t.rss}
        </a>
      </nav>
    </footer>
  );
}
