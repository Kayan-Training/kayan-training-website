import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import {
  type EventRow,
  EventsTable,
} from "@/app/[locale]/dashboard/events/events-table";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export const metadata = { title: "Events" };

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
    slug: event.slug,
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
    <section className="space-y-5 max-w-6xl mx-auto">
      <div className="">
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
            className={cn(
              buttonVariants(),
              "inline-flex h-10 items-center bg-primary/80 text-xs font-semibold uppercase tracking-widest text-primary-container! transition-colors hover:bg-secondary cursor-pointer rounded-[4px] bg-linear-to-t from-black/10 from-20% via-black/5 via-40% to-transparent border-primary border",
            )}
            href={`/${activeLocale}/dashboard/events/new`}
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
            {activeLocale === "ar" ? "فعالية جديدة" : "New Event"}
          </Link>
        </div>
      </div>
      <EventsTable events={rows} activeLocale={activeLocale} />
    </section>
  );
}
