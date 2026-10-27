import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import { site } from "@/config/site";
import "./globals.css";

const display = Big_Shoulders({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-big-shoulders",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-instrument",
  display: "swap",
});

const title = `${site.name} — Açaí do seu jeito`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s — ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: site.name,
    title,
    description: site.description,
    images: [{ url: "/images/og.jpg", width: 1200, height: 630, alt: `Copo de açaí — ${site.name}` }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
    images: ["/images/og.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#240D38",
  width: "device-width",
  initialScale: 1,
};

/**
 * Decide antes da primeira pintura se a intro roda (uma vez por sessão e nunca
 * com movimento reduzido). Assim o Hero não "pisca" por baixo da intro.
 */
const introScript = `(function(){var d=document.documentElement;try{var seen=sessionStorage.getItem('acai-intro-seen');var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;d.setAttribute('data-intro',(seen||reduce)?'skip':'play');}catch(e){d.setAttribute('data-intro','skip');}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <link rel="preload" as="image" href="/sequence/spin/desktop/f000.webp" type="image/webp" />
      </head>
      <body>
        <noscript>
          <style>{`.intro-overlay{display:none!important}`}</style>
        </noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
