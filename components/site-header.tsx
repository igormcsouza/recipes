import { ChefHat } from "lucide-react";
import Link from "next/link";
import { dict, type Lang } from "@/lib/i18n";
import { indexPath, routeTable } from "@/lib/recipes";
import { SettingsMenu } from "./settings-menu";

export function SiteHeader({ lang }: { lang: Lang }) {
  const t = dict[lang];
  return (
    <header className="border-b print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href={indexPath(lang)} className="inline-flex min-h-11 items-center gap-2 font-medium text-primary">
          <ChefHat aria-hidden className="size-6" />
          {t.siteName}
        </Link>
        <SettingsMenu lang={lang} routes={routeTable()} t={{ settings: t.settings, language: t.language, theme: t.theme, system: t.system, light: t.light, dark: t.dark }} />
      </div>
    </header>
  );
}
