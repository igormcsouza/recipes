"use client";
import { Printer } from "lucide-react";
import { iconBtn } from "./ui";

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} aria-label={label} title={label} className={iconBtn}>
      <Printer aria-hidden className="size-5" />
    </button>
  );
}
