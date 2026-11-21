"use client";
import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { LANGS, switchPath, type Dict, type Lang } from "@/lib/i18n";

type Props = { lang: Lang; routes: Record<Lang, string>[]; t: Pick<Dict, "settings" | "language" | "theme" | "system" | "light" | "dark"> };

const seg = "inline-flex h-11 flex-1 items-center justify-center border-input px-3 text-sm first:rounded-l-lg last:rounded-r-lg [&:not(:first-child)]:border-l";
const on = "bg-primary text-primary-foreground";

export function SettingsMenu({ lang, routes, t }: Props) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={t.settings}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="inline-flex size-11 items-center justify-center rounded-lg border border-input transition hover:bg-accent"
      >
        <Settings aria-hidden className="size-5" />
      </button>
      {open && (
        <div role="dialog" aria-label={t.settings} className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg">
          <p className="mb-1 text-sm text-muted-foreground">{t.language}</p>
          <div className="mb-3 flex rounded-lg border border-input">
            {LANGS.map((l) => (
              <Link
                key={l}
                href={switchPath(routes, pathname, l)}
                hrefLang={l}
                lang={l}
                aria-current={l === lang ? "true" : undefined}
                onClick={() => {
                  document.cookie = `lang=${l};path=/;max-age=31536000;samesite=lax`;
                  setOpen(false);
                }}
                className={`${seg} ${l === lang ? on : "hover:bg-accent"}`}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </div>
          <p className="mb-1 text-sm text-muted-foreground">{t.theme}</p>
          <div className="flex rounded-lg border border-input">
            {(["system", "light", "dark"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={theme === k} onClick={() => setTheme(k)} className={`${seg} ${theme === k ? on : "hover:bg-accent"}`}>
                {t[k]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
