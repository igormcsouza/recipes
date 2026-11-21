"use client";
import { Printer } from "lucide-react";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center gap-2 rounded-lg border border-input px-3 text-sm text-primary transition hover:bg-accent active:scale-[0.98]"
    >
      <Printer aria-hidden className="size-5" />
      {label}
    </button>
  );
}
