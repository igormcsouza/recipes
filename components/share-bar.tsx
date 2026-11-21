import { AtSign, MessageCircle, Pin, Send, ThumbsUp } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { shareTargets } from "@/lib/share";
import { CopyButton } from "./copy-button";
import { PrintButton } from "./print-button";
import { iconBtn } from "./ui";

// Lucide has no brand logos: generic icons, each with an accessible name and tooltip.
const ICONS = { whatsapp: MessageCircle, telegram: Send, facebook: ThumbsUp, x: AtSign, pinterest: Pin };

type Props = { url: string; title: string; image?: string; t: Pick<Dict, "shareThis" | "copyLink" | "copied" | "print" | "opensInNewTab"> };

export function ShareBar({ url, title, image, t }: Props) {
  return (
    <section
      id="share"
      aria-labelledby="share-h"
      className="mt-9 flex scroll-mt-6 flex-col gap-4 rounded-[28px] bg-soft px-5 py-[22px] print:hidden min-[720px]:mt-16 min-[720px]:flex-row min-[720px]:flex-wrap min-[720px]:items-center min-[720px]:justify-between min-[720px]:gap-5 min-[720px]:rounded-[32px] min-[720px]:px-8 min-[720px]:py-7"
    >
      <h2 id="share-h" className="font-serif text-2xl font-semibold tracking-tight min-[720px]:text-[28px]">
        {t.shareThis}
      </h2>
      <div className="flex flex-wrap gap-2 min-[720px]:gap-2.5">
        {shareTargets(url, title, image).map((s) => {
          const Icon = ICONS[s.key];
          return (
            <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} (${t.opensInNewTab})`} title={s.label} className={iconBtn}>
              <Icon aria-hidden className="size-5" />
            </a>
          );
        })}
        <CopyButton text={url} label={t.copyLink} copiedLabel={t.copied} link />
        <PrintButton label={t.print} />
      </div>
    </section>
  );
}
