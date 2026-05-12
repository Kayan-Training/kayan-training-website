import type { Metadata } from "next";

import { EventsListingClient } from "@/components/events/events-listing-client";
import { resolveCategoryIconPath } from "@/lib/category-icons";
import { getListingConfig, getLocalizedEvents } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";
import { buildMetadataWithLocaleAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const config = await getListingConfig(activeLocale, "training-courses");
  return buildMetadataWithLocaleAlternates({
    description: config?.subheading || (activeLocale === "ar"
      ? "اكتشف الدورات التدريبية القادمة."
      : "Discover upcoming training courses."),
    locale: activeLocale,
    path: "/training-courses",
    title: config?.heading || (activeLocale === "ar" ? "الدورات التدريبية" : "Training Courses"),
  });
}

export default async function TrainingCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const listingConfig = await getListingConfig(activeLocale, "training-courses");
  const pageSize = listingConfig?.resultsPerPage ?? 12;
  const [events, pastEvents] = await Promise.all([
    getLocalizedEvents(activeLocale, pageSize * 10, { kind: "training_course" }),
    getLocalizedEvents(activeLocale, pageSize * 10, { kind: "training_course", includePast: true }),
  ]);
  const upcomingSlugs = new Set(events.map((event) => event.slug));
  const pastOnly = pastEvents.filter((event) => !upcomingSlugs.has(event.slug));

  const listingEvents = events.map((event) => ({
    categoryIcons: event.categories.map((category) =>
      resolveCategoryIconPath(category.icon, category.slug),
    ),
    coverImage: event.coverImage,
    dateIso: event.startDate.toISOString(),
    excerpt: event.excerpt,
    isFeatured: event.isFeatured,
    listingType: "training" as const,
    location: event.location,
    searchText: `${event.title} ${event.excerpt} ${event.location} ${event.categories.map((category) => category.label).join(" ")}`.toLowerCase(),
    slug: event.slug,
    title: event.title,
  }));

  return (
    <main className="events-page pt-16">
      <EventsListingClient
        eyebrow={listingConfig?.eyebrow}
        heading={listingConfig?.heading ?? (activeLocale === "ar" ? "الدورات التدريبية" : "Training Courses")}
        initialEvents={listingEvents}
        initialPastEvents={pastOnly.map((event) => ({
          categoryIcons: event.categories.map((category) =>
            resolveCategoryIconPath(category.icon, category.slug),
          ),
          coverImage: event.coverImage,
          dateIso: event.startDate.toISOString(),
          excerpt: event.excerpt,
          isFeatured: event.isFeatured,
          listingType: "training" as const,
          location: event.location,
          searchText: `${event.title} ${event.excerpt} ${event.location}`.toLowerCase(),
          slug: event.slug,
          title: event.title,
        }))}
        locale={activeLocale}
        pageSize={pageSize}
        subheading={listingConfig?.subheading}
        basePath="training-courses"
      />
    </main>
  );
}
