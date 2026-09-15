import { getEventDetailBySlug } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";
import { buildOgImage } from "@/lib/og/build-og-image";

export const alt = "Event cover image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const event = await getEventDetailBySlug(activeLocale, slug);

  const title = event?.seoTitle || event?.title || "Kayan Training & Consulting";
  const dateLabel = event
    ? new Intl.DateTimeFormat(activeLocale === "ar" ? "ar-OM-u-nu-latn" : "en-GB", {
        dateStyle: "long",
      }).format(new Date(event.startDate))
    : undefined;
  const subtitle = event ? [dateLabel, event.location].filter(Boolean).join(" · ") : undefined;

  return buildOgImage({
    title,
    subtitle,
    backgroundImageUrl: event?.seoImage || event?.coverImage || undefined,
    locale: activeLocale,
  });
}
