import { cache } from "react";

import { db } from "@/lib/db";
import type { AppLocale } from "@/lib/i18n/config";

type SettingMap = Map<string, string>;

const getSettingsMap = cache(async (): Promise<SettingMap> => {
  const settings = await db.setting.findMany({
    where: {
      key: {
        in: [
          "site.name",
          "site.name.ar",
          "site.name.en",
          "site.tagline",
          "site.tagline.ar",
          "site.tagline.en",
          "site.description",
          "site.description.ar",
          "site.description.en",
          "contact.email",
          "contact.phone",
          "contact.address",
          "social.linkedin",
          "social.twitter",
          "social.instagram",
          "social.youtube",
          "social.links",
          "frontend.theme.background",
          "frontend.theme.foreground",
          "frontend.theme.card",
          "frontend.theme.muted",
          "frontend.theme.mutedForeground",
          "frontend.theme.border",
          "frontend.theme.surface",
          "frontend.theme.surfaceDim",
          "frontend.theme.surfaceContainerLow",
          "frontend.theme.surfaceContainerLowest",
          "frontend.theme.accent",
          "frontend.theme.border",
        ],
      },
    },
  });

  return new Map(
    settings.map((s) => [s.key, typeof s.value === "string" ? s.value : ""]),
  );
});

function fromMap(map: SettingMap, key: string): string {
  return map.get(key)?.trim() ?? "";
}

export async function getLocalizedSiteSettings(locale: AppLocale) {
  const map = await getSettingsMap();

  const siteName =
    fromMap(map, `site.name.${locale}`) ||
    fromMap(map, "site.name") ||
    (locale === "ar" ? "كيان للتدريب والاستشارات" : "Kayan Training & Consulting");

  const siteTagline =
    fromMap(map, `site.tagline.${locale}`) ||
    fromMap(map, "site.tagline") ||
    (locale === "ar"
      ? "الشريك الاستراتيجي للتطوير المؤسسي في سلطنة عُمان. تدريب دقيق لعالم متغير."
      : "The strategic partner for institutional development in the Sultanate of Oman. Precise training for a changing world.");

  const siteDescription =
    fromMap(map, `site.description.${locale}`) ||
    fromMap(map, "site.description") ||
    (locale === "ar"
      ? "منصة متعددة اللغات لإدارة الفعاليات والمحتوى المعرفي."
      : "A multilingual platform for events, consulting, and knowledge content.");

  const contactEmail = fromMap(map, "contact.email") || "training@kayan.om";
  const contactPhone = fromMap(map, "contact.phone") || "+968 9538 3138";
  const contactAddress =
    fromMap(map, "contact.address") ||
    (locale === "ar" ? "سلطنة عُمان، مسقط" : "Sultanate of Oman, Muscat");
  const socialLinkedIn = fromMap(map, "social.linkedin");
  const socialX = fromMap(map, "social.twitter");
  const socialInstagram = fromMap(map, "social.instagram");
  const socialYouTube = fromMap(map, "social.youtube");
  const socialLinksRaw = fromMap(map, "social.links");
  const socialLinks = (() => {
    if (!socialLinksRaw) {
      return [
        socialLinkedIn ? { platform: "linkedin", url: socialLinkedIn } : null,
        socialX ? { platform: "x", url: socialX } : null,
        socialInstagram ? { platform: "instagram", url: socialInstagram } : null,
        socialYouTube ? { platform: "youtube", url: socialYouTube } : null,
      ].filter(Boolean) as { platform: string; url: string }[];
    }
    try {
      const parsed = JSON.parse(socialLinksRaw) as { platform?: string; url?: string }[];
      return parsed
        .filter((item) => item?.platform && item?.url)
        .map((item) => ({ platform: String(item.platform), url: String(item.url) }));
    } catch {
      return [];
    }
  })();
  const frontendTheme = {
    background: fromMap(map, "frontend.theme.background") || "#121414",
    foreground: fromMap(map, "frontend.theme.foreground") || "#e2e2e2",
    card: fromMap(map, "frontend.theme.card") || "#1a1c1c",
    muted: fromMap(map, "frontend.theme.muted") || "#1e2020",
    mutedForeground: fromMap(map, "frontend.theme.mutedForeground") || "#8b9295",
    border: fromMap(map, "frontend.theme.border") || "#41484a",
    surface: fromMap(map, "frontend.theme.surface") || "#121414",
    surfaceDim: fromMap(map, "frontend.theme.surfaceDim") || "#0d0f0f",
    surfaceContainerLow:
      fromMap(map, "frontend.theme.surfaceContainerLow") || "#1a1c1c",
    surfaceContainerLowest:
      fromMap(map, "frontend.theme.surfaceContainerLowest") || "#0d0f0f",
    accent: fromMap(map, "frontend.theme.accent") || "#1e2020",
  };

  return {
    contactAddress,
    contactEmail,
    contactPhone,
    siteDescription,
    siteName,
    siteTagline,
    socialInstagram,
    socialLinkedIn,
    socialLinks,
    socialX,
    socialYouTube,
    frontendTheme,
  };
}
