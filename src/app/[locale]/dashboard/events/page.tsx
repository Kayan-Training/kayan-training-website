import Link from "next/link";

import { EventsTable, type EventRow } from "@/app/[locale]/dashboard/events/events-table";
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

export default async function DashboardEventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const events = await db.event.findMany({
    include: {
      registrations: {
        select: { id: true },
      },
      translations: {
        take: 1,
        where: { locale: activeLocale },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const rows: EventRow[] = events.map((event) => ({
    coverImage: event.coverImage,
    endDate: event.endDate,
    id: event.id,
    isFeatured: event.isFeatured,
    locale: activeLocale,
    registrationsCount: event.registrations.length,
    startDate: event.startDate,
    status: event.status,
    title: event.translations[0]?.title ?? event.slug,
    type: event.type,
  }));

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">
              {activeLocale === "ar" ? "إدارة الفعاليات" : "Manage Events"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeLocale === "ar"
                ? "فلترة، فرز، وتحرير الفعاليات بسرعة من شاشة واحدة."
                : "Filter, sort, and edit events quickly from one screen."}
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
            href={`/${activeLocale}/dashboard/events/new`}
          >
            {activeLocale === "ar" ? "فعالية جديدة" : "New Event"}
          </Link>
        </div>
      </div>
      <EventsTable events={rows} />
    </section>
  );
}
