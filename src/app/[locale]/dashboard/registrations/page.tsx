import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { RegistrationsTable, type RegistrationRow } from "./registrations-table";

export const metadata = { title: "Registrations" };

export default async function RegistrationsDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const registrations = await db.registration.findMany({
    include: {
      event: { include: { translations: { where: { locale: activeLocale }, take: 1 } } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: RegistrationRow[] = registrations.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    eventTitle: r.event.translations[0]?.title ?? r.event.slug,
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
        <h1 className="text-2xl font-semibold">Registrations</h1>
      </div>
      <RegistrationsTable locale={activeLocale} registrations={rows} />
    </section>
  );
}
