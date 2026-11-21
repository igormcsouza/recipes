"use client";
import { Check, Copy, Link } from "lucide-react";
import { useState } from "react";
import { iconBtn } from "./ui";

type Props = { text: string; label: string; copiedLabel: string; link?: boolean };

export function CopyButton({ text, label, copiedLabel, link = false }: Props) {
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

  const Icon = done ? Check : link ? Link : Copy;
  return (
    <>
      <button type="button" onClick={copy} aria-label={label} title={label} className={iconBtn}>
        <Icon aria-hidden className="size-5" />
      </button>
      <span role="status" className="sr-only">
        {done ? copiedLabel : ""}
      </span>
    </>
  );
}
