import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Fraunces } from "next/font/google"; // house-style: allow headings font from the redesign
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LANGS, dict, isLang } from "@/lib/i18n";
import { SITE_URL } from "@/lib/recipes";
import "../globals.css";

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = dict[isLang(lang) ? lang : "en"];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.siteName, template: `%s | ${t.siteName}` },
    description: t.siteTagline,
    alternates: { types: { "application/rss+xml": `/${lang}/rss.xml` } },
  };
}

const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], weight: ["500", "600"], variable: "--font-fraunces", display: "swap" }); // house-style: allow headings font from the redesign

const GOATCOUNTER = process.env.NEXT_PUBLIC_GOATCOUNTER;

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-30 focus:bg-background focus:p-3">
          {dict[lang].skip}
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SiteHeader lang={lang} />
          <main id="main" className="flex-1">{children}</main>
          <SiteFooter lang={lang} />
        </ThemeProvider>
        {GOATCOUNTER && <Script src="https://gc.zgo.at/count.js" strategy="afterInteractive" data-goatcounter={`https://${GOATCOUNTER}.goatcounter.com/count`} />}
      </body>
    </html>
  );
}
