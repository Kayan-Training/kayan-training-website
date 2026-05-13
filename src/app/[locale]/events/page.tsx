import type { Metadata } from "next";

import { EventsListingClient } from "@/components/events/events-listing-client";
import { resolveCategoryIconPath } from "@/lib/category-icons";
import { getListingConfig, getLocalizedEvents } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";
import { buildMetadataWithLocaleAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const config = await getListingConfig(activeLocale, "events");
  return buildMetadataWithLocaleAlternates({
    description: config?.subheading || (activeLocale === "ar"
      ? "اكتشف برامجنا التدريبية والفعاليات القادمة."
      : "Discover our upcoming training programs and events."),
    locale: activeLocale,
    path: "/events",
    title: config?.heading || (activeLocale === "ar" ? "الفعاليات والبرامج" : "Events & Programs"),
  });
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const listingConfig = await getListingConfig(activeLocale, "events");
  const pageSize = listingConfig?.resultsPerPage ?? 12;
  const [events, pastEvents] = await Promise.all([
    getLocalizedEvents(activeLocale, pageSize * 10, { kind: "event" }),
    getLocalizedEvents(activeLocale, pageSize * 10, { kind: "event", includePast: true }),
  ]);
  const upcomingSlugs = new Set(events.map((event) => event.slug));
  const pastOnly = pastEvents.filter((event) => !upcomingSlugs.has(event.slug));

  const listingEvents = events.map((event) => {
    const categorySlugs = event.categories.map((category) => category.slug.toLowerCase());
    const listingType = categorySlugs.some((slug) => slug.includes("consult"))
      ? "consulting"
      : categorySlugs.some((slug) => slug.includes("evening"))
        ? "evenings"
        : "training";

    return {
      categoryIcons: event.categories.map((category) =>
        resolveCategoryIconPath(category.icon, category.slug),
      ),
      coverImage: event.coverImage,
      dateIso: event.startDate.toISOString(),
      excerpt: event.excerpt,
      isFeatured: event.isFeatured,
      listingType: listingType as "consulting" | "evenings" | "training",
      location: event.location,
      logo: event.heroProgramLogo,
      capacity: event.capacity,
      registrationsCount: event.registrationsCount,
      registrationsOpen: event.registrationsOpen,
      searchText: `${event.title} ${event.excerpt} ${event.location} ${event.categories.map((category) => category.label).join(" ")}`.toLowerCase(),
      slug: event.slug,
      title: event.title,
    };
  });

  return (
    <main className="events-page pt-16">
      <EventsListingClient
        eyebrow={listingConfig?.eyebrow}
        heading={listingConfig?.heading}
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
          logo: event.heroProgramLogo,
          capacity: event.capacity,
          registrationsCount: event.registrationsCount,
          registrationsOpen: event.registrationsOpen,
          searchText: `${event.title} ${event.excerpt} ${event.location}`.toLowerCase(),
          slug: event.slug,
          title: event.title,
        }))}
        locale={activeLocale}
        pageSize={pageSize}
        subheading={listingConfig?.subheading}
      />
    </main>
  );
}
