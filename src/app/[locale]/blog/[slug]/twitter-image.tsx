import { getPostDetailBySlug } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";
import { buildOgImage } from "@/lib/og/build-og-image";

export const alt = "Blog post cover image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const post = await getPostDetailBySlug(activeLocale, slug);

  return buildOgImage({
    title: post?.seoTitle || post?.title || "Kayan Training & Consulting",
    backgroundImageUrl: post?.seoImage || post?.coverImage || undefined,
    locale: activeLocale,
  });
}
