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

  return {
    contactAddress,
    contactEmail,
    contactPhone,
    siteDescription,
    siteName,
    siteTagline,
    socialInstagram,
    socialLinkedIn,
    socialX,
    socialYouTube,
  };
}
