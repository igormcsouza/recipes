import { ChefHat } from "lucide-react";
import Link from "next/link";
import { dict, type Lang } from "@/lib/i18n";
import { indexPath, routeTable } from "@/lib/recipes";
import { SettingsMenu } from "./settings-menu";

export function SiteHeader({ lang }: { lang: Lang }) {
  const t = dict[lang];
  return (
    <header className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-5 py-4 print:hidden min-[720px]:px-8 min-[720px]:py-5">
      <Link href={indexPath(lang)} className="flex items-center gap-2.5 min-[720px]:gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground min-[720px]:size-11">
          <ChefHat aria-hidden className="size-5 min-[720px]:size-[22px]" />
        </span>
        <span className="font-serif text-lg font-semibold tracking-tight min-[720px]:text-xl">{t.siteName}</span>
      </Link>
      <SettingsMenu lang={lang} routes={routeTable()} t={{ settings: t.settings, close: t.close, language: t.language, theme: t.theme, system: t.system, light: t.light, dark: t.dark }} />
    </header>
  );
}
