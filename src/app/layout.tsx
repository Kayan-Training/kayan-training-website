/**
 * Root layout kept intentionally minimal.
 *
 * Locale-specific concerns (lang/dir/fonts/metadata) are handled in `app/[locale]/layout.tsx`.
 * This layout only provides global CSS and a stable body wrapper shared by all routes.
 */
import { TooltipProvider } from "@/components/ui/tooltip";
import { LOCALE_DIRECTION, type AppLocale, isSupportedLocale } from "@/lib/i18n/config";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getBaseUrl } from "@/lib/seo";
import {
  Alexandria,
  DM_Mono,
  IBM_Plex_Sans_Arabic,
  Montserrat,
} from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import NextTopLoader from 'nextjs-toploader';
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600"],
});
const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
  weight: ["400", "500", "600"],
});
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  variable: "--font-ibm-plex-arabic",
  weight: ["400", "500", "600"],
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "Kayan Training & Consulting",
    template: "%s — Kayan",
  },
  description: "Multilingual platform for events, consulting, and knowledge content.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const preferredLocaleRaw = cookieStore.get("preferred_locale")?.value;
  const locale: AppLocale = preferredLocaleRaw && isSupportedLocale(preferredLocaleRaw) ? preferredLocaleRaw : "ar";

  return (
    <html
      dir={LOCALE_DIRECTION[locale]}
      lang={locale}
      className={cn(
        "h-full antialiased",
        montserrat.variable,
        alexandria.variable,
        ibmPlexArabic.variable,
        dmMono.variable,
        GeistSans.variable,
        GeistMono.variable,
      )}
    >
      <body className="min-h-full">
        <NextTopLoader />
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
