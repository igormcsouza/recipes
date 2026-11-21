"use client";
import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useRef } from "react";
import { LANGS, switchPath, type Dict, type Lang } from "@/lib/i18n";
import { iconBtn } from "./ui";

type Props = {
  lang: Lang;
  routes: Record<Lang, string>[];
  t: Pick<Dict, "settings" | "close" | "language" | "theme" | "system" | "light" | "dark">;
};

const seg = "inline-flex h-12 flex-1 items-center justify-center rounded-full px-3 text-[15px] font-medium transition";
const on = "bg-primary text-primary-foreground";
const group = "flex gap-1 rounded-full bg-muted p-1";

/** Settings live in a native modal <dialog>: backdrop, focus trap, Escape and focus return come from the browser. */
export function SettingsMenu({ lang, routes, t }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <>
      <button
        type="button"
        aria-label={t.settings}
        aria-haspopup="dialog"
        onClick={() => dialog.current!.showModal()}
        className={iconBtn}
      >
        <SlidersHorizontal aria-hidden className="size-5" />
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="settings-title"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="mx-auto mb-auto mt-[min(140px,12vh)] w-[min(26.25rem,calc(100vw-3rem))] rounded-[32px] border bg-popover p-0 text-popover-foreground shadow-float backdrop:bg-black/55"
      >
        <div className="flex flex-col gap-6 p-7">
          <div className="flex items-center justify-between">
            <h2 id="settings-title" className="font-serif text-[28px] font-semibold tracking-tight">
              {t.settings}
            </h2>
            <button
              type="button"
              aria-label={t.close}
              onClick={() => dialog.current!.close()}
              className={iconBtn}
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
          <p className="text-sm font-medium text-muted-foreground">{t.language}</p>
          <div className={group}>
            {LANGS.map((l) => (
              <Link
                key={l}
                href={switchPath(routes, pathname, l)}
                hrefLang={l}
                lang={l}
                aria-current={l === lang ? "true" : undefined}
                onClick={() => {
                  document.cookie = `lang=${l};path=/;max-age=31536000;samesite=lax`;
                  dialog.current!.close();
                }}
                className={`${seg} ${l === lang ? on : "hover:bg-card"}`}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </div>
          </div>
          <div className="flex flex-col gap-2.5">
          <p className="text-sm font-medium text-muted-foreground">{t.theme}</p>
          <div className={group}>
            {(["system", "light", "dark"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={theme === k} onClick={() => setTheme(k)} className={`${seg} ${theme === k ? on : "hover:bg-card"}`}>
                {t[k]}
              </button>
            ))}
          </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
