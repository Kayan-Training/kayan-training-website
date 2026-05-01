import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { RegistrationsTable, type RegistrationRow } from "../registrations-table";

export default async function EventRegistrationsPage({
  params,
}: {
  params: Promise<{ locale: string; eventId: string }>;
}) {
  const { locale, eventId } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      translations: { where: { locale: activeLocale }, take: 1 },
      registrations: {
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!event) notFound();

  const eventTitle = event.translations[0]?.title ?? event.slug;

  const rows: RegistrationRow[] = event.registrations.map((r) => ({
    id: r.id,
    eventId: event.id,
    eventTitle,
    registrantName: r.user?.name ?? r.user?.email ?? "Guest",
    registrantEmail: r.user?.email ?? "",
    status: r.status,
    paymentStatus: r.paymentStatus,
    amount: r.amount?.toString() ?? null,
    createdAt: r.createdAt,
    locale: activeLocale,
  }));

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">{eventTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{rows.length} registrations</p>
      </div>
      <RegistrationsTable locale={activeLocale} registrations={rows} />
    </section>
  );
}
