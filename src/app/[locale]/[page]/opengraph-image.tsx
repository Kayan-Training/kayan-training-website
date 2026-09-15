import { getStaticPageBySlug } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";
import { buildOgImage } from "@/lib/og/build-og-image";

export const alt = "Page cover image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale, page: slug } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const page = await getStaticPageBySlug(activeLocale, slug);

  return buildOgImage({
    title: page?.seoTitle || page?.title || "Kayan Training & Consulting",
    backgroundImageUrl: page?.seoImage || undefined,
    locale: activeLocale,
  });
}
