import type { Ingredient } from "./recipes";

export type ShareTarget = { key: "whatsapp" | "telegram" | "facebook" | "x" | "pinterest"; label: string; href: string };

export function shareTargets(url: string, title: string, image?: string): ShareTarget[] {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const both = encodeURIComponent(`${title} ${url}`);
  return [
    { key: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${both}` },
    { key: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { key: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: "x", label: "X", href: `https://x.com/intent/post?text=${t}&url=${u}` },
    {
      key: "pinterest",
      label: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${u}&description=${t}${image ? `&media=${encodeURIComponent(image)}` : ""}`,
    },
  ];
}

/** Ordered plain-text list, what the copy button puts on the clipboard. */
export const ingredientsText = (list: Ingredient[]): string => list.map((x, i) => `${i + 1}. ${x.text}`).join("\n");
