"use client";

/**
 * Route-aware shell wrapper.
 *
 * Auth and dashboard screens intentionally render without global site chrome.
 */
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

import { SiteFooter } from "@/components/layout/footer";
import { SiteNav, type NavMenuItem } from "@/components/layout/nav";
import type { AnimatedCategoryIconItem } from "@/lib/content/category-icons";

export function LocaleShell({
  children,
  locale,
  menuItems,
  siteSettings,
  footerCategoryIcons,
}: {
  children: React.ReactNode;
  locale: "ar" | "en";
  menuItems?: NavMenuItem[];
  footerCategoryIcons?: AnimatedCategoryIconItem[];
  siteSettings?: {
    contactAddress: string;
    contactEmail: string;
    contactPhone: string;
    siteName: string;
    siteTagline: string;
    socialInstagram: string;
    socialLinkedIn: string;
    socialLinks?: { platform: string; url: string }[];
    socialX: string;
    socialYouTube: string;
    headerCta?: {
      labelAr: string;
      labelEn: string;
      url: string;
    };
    footerShowAnimatedCategoryIcons?: boolean;
    frontendTheme?: {
      background: string;
      foreground: string;
      card: string;
      muted: string;
      mutedForeground: string;
      border: string;
      accent: string;
      surface: string;
      surfaceDim: string;
      surfaceContainerLow: string;
      surfaceContainerLowest: string;
    };
  };
}) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith(`/${locale}/auth`);
  const isDashboardRoute = pathname?.startsWith(`/${locale}/dashboard`);

  if (isAuthRoute || isDashboardRoute) {
    return <>{children}</>;
  }

  return (
    <div
      className="frontend-shell overflow-x-clip bg-background text-on-surface"
      style={
        siteSettings?.frontendTheme
          ? ({
              "--background": siteSettings.frontendTheme.background,
              "--foreground": siteSettings.frontendTheme.foreground,
              "--card": siteSettings.frontendTheme.card,
              "--muted": siteSettings.frontendTheme.muted,
              "--muted-foreground": siteSettings.frontendTheme.mutedForeground,
              "--border": siteSettings.frontendTheme.border,
              "--input": siteSettings.frontendTheme.border,
              "--color-surface": siteSettings.frontendTheme.surface,
              "--color-surface-dim": siteSettings.frontendTheme.surfaceDim,
              "--color-surface-container-lowest": siteSettings.frontendTheme.surfaceContainerLowest,
              "--color-surface-container-low": siteSettings.frontendTheme.surfaceContainerLow,
              "--color-surface-container": siteSettings.frontendTheme.muted,
              "--color-surface-container-high": siteSettings.frontendTheme.card,
              "--color-surface-container-highest": siteSettings.frontendTheme.card,
              "--card-foreground": siteSettings.frontendTheme.foreground,
              "--popover": siteSettings.frontendTheme.card,
              "--popover-foreground": siteSettings.frontendTheme.foreground,
              "--accent": siteSettings.frontendTheme.accent,
              "--accent-foreground": siteSettings.frontendTheme.foreground,
            } as CSSProperties)
          : undefined
      }
    >
      <SiteNav locale={locale} menuItems={menuItems} cta={siteSettings?.headerCta} />
      <div className="min-w-0">{children}</div>
      <SiteFooter
        locale={locale}
        settings={siteSettings}
        footerCategoryIcons={footerCategoryIcons}
      />
    </div>
  );
}
