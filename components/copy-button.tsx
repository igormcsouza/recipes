"use client";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

type Props = { text: string; label: string; copiedLabel: string; iconOnly?: boolean };

export function CopyButton({ text, label, copiedLabel, iconOnly = false }: Props) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }

  const Icon = done ? Check : Copy;
  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
        className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-input px-3 text-sm text-primary transition hover:bg-accent active:scale-[0.98]"
      >
        <Icon aria-hidden className="size-5" />
        {iconOnly ? null : done ? copiedLabel : label}
      </button>
      <span role="status" className="sr-only">
        {done ? copiedLabel : ""}
      </span>
    </>
  );
}
