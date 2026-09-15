import { getLocalizedSiteSettings } from "@/lib/settings";
import { isSupportedLocale } from "@/lib/i18n/config";
import { buildOgImage } from "@/lib/og/build-og-image";

export const alt = "Kayan Training & Consulting";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const site = await getLocalizedSiteSettings(activeLocale);

  return buildOgImage({
    title: site.siteName,
    subtitle: site.siteTagline,
    locale: activeLocale,
  });
}
