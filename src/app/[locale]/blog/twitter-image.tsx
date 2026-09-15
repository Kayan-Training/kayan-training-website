import { getListingConfig } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";
import { buildOgImage } from "@/lib/og/build-og-image";

export const alt = "Knowledge Library";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const config = (await getListingConfig(activeLocale, "blog")) ?? (await getListingConfig(activeLocale, "posts"));

  return buildOgImage({
    title: config?.heading || (activeLocale === "ar" ? "المكتبة المعرفية" : "Knowledge Library"),
    locale: activeLocale,
  });
}
