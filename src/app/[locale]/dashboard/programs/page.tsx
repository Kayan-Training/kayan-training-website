import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { type EventRow } from "@/app/[locale]/dashboard/events/events-table";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { ProgramsTabs } from "./programs-tabs";

export const metadata = { title: "Programs" };

export default async function DashboardProgramsPage({
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
    eventKind: ((event as { eventKind?: string }).eventKind ??
      "event") as EventRow["eventKind"],
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
    <section className="space-y-5 max-w-6xl mx-auto p-3 md:p-6">
      <div className="">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">
              {activeLocale === "ar" ? "إدارة البرامج" : "Manage Programs"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeLocale === "ar"
                ? "فلترة، فرز، وتحرير الفعاليات والدورات من شاشة واحدة."
                : "Filter, sort, and edit events and training courses quickly from one screen."}
            </p>
          </div>
          <Link
            className={cn(
              buttonVariants(),
              "inline-flex h-10 items-center text-xs font-semibold transition-colors  cursor-pointer rounded-[4px] bg-linear-to-t from-black/10 from-20% via-black/5 via-40% to-transparent border-primary border",
            )}
            href={`/${activeLocale}/dashboard/programs/new`}
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
            {activeLocale === "ar" ? "برنامج جديد" : "New Program"}
          </Link>
        </div>
      </div>
      <ProgramsTabs activeLocale={activeLocale} rows={rows} />
    </section>
  );
}
