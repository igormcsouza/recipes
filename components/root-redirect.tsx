"use client";
import { useEffect } from "react";
import { isLang, pickLang } from "@/lib/i18n";

/** Fallback for `/` when CloudFront's edge redirect is not in front (local dev, plain static hosting). */
export function RootRedirect() {
  useEffect(() => {
    const saved = document.cookie.match(/(?:^|; )lang=(\w+)/)?.[1] ?? "";
    const lang = isLang(saved) ? saved : pickLang(navigator.languages.join(","));
    window.location.replace(`/${lang}/`);
  }, []);
  return null;
}
