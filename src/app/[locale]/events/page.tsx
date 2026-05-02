import type { Metadata } from "next";

import { EventsListingClient } from "@/components/events/events-listing-client";
import { getListingConfig, getLocalizedEvents } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const config = await getListingConfig(activeLocale, "events");
  return {
    title: config?.heading || (activeLocale === "ar" ? "الفعاليات والبرامج" : "Events & Programs"),
    description: config?.subheading || (activeLocale === "ar"
      ? "اكتشف برامجنا التدريبية والفعاليات القادمة."
      : "Discover our upcoming training programs and events."),
  };
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
  const events = await getLocalizedEvents(activeLocale, pageSize * 10);

  const listingEvents = events.map((event) => {
    const categorySlugs = event.categories.map((category) => category.slug.toLowerCase());
    const listingType = categorySlugs.some((slug) => slug.includes("consult"))
      ? "consulting"
      : categorySlugs.some((slug) => slug.includes("evening"))
        ? "evenings"
        : "training";

    return {
      coverImage: event.coverImage,
      dateIso: event.startDate.toISOString(),
      excerpt: event.excerpt,
      isFeatured: event.isFeatured,
      listingType: listingType as "consulting" | "evenings" | "training",
      location: event.location,
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
        locale={activeLocale}
        pageSize={pageSize}
        subheading={listingConfig?.subheading}
      />
    </main>
  );
}
