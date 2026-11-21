import { MessageCircle, Pin, Send, Share2, X } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { shareTargets } from "@/lib/share";
import { CopyButton } from "./copy-button";
import { PrintButton } from "./print-button";

const ICONS = { whatsapp: MessageCircle, telegram: Send, facebook: Share2, x: X, pinterest: Pin };

type Props = { url: string; title: string; image?: string; t: Pick<Dict, "shareThis" | "copyLink" | "copied" | "print" | "opensInNewTab"> };

export function ShareBar({ url, title, image, t }: Props) {
  return (
    <section id="share" aria-labelledby="share-h" className="mt-10 scroll-mt-6 border-t pt-6 print:hidden">
      <h2 id="share-h" className="mb-3 text-xl font-medium">
        {t.shareThis}
      </h2>
      <div className="flex flex-wrap gap-2">
        {shareTargets(url, title, image).map((s) => {
          const Icon = ICONS[s.key];
          return (
            <a
              key={s.key}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-input px-3 text-sm text-primary transition hover:bg-accent active:scale-[0.98]"
            >
              <Icon aria-hidden className="size-5" />
              {s.label}
              <span className="sr-only">({t.opensInNewTab})</span>
            </a>
          );
        })}
        <CopyButton text={url} label={t.copyLink} copiedLabel={t.copied} />
        <PrintButton label={t.print} />
      </div>
    </section>
  );
}
