/**
 * Root layout kept intentionally minimal.
 *
 * Locale-specific concerns (lang/dir/fonts/metadata) are handled in `app/[locale]/layout.tsx`.
 * This layout only provides global CSS and a stable body wrapper shared by all routes.
 */
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
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
  title: {
    default: "Kayan Training & Consulting",
    template: "%s — Kayan",
  },
  description: "Multilingual platform for events, consulting, and knowledge content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
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
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
