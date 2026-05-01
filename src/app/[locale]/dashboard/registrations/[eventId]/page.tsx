import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

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
      translations: {
        where: { locale: activeLocale },
        take: 1,
      },
      registrations: {
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!event) notFound();

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">{event.translations[0]?.title ?? event.slug}</h1>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Participant</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Payment</th>
            </tr>
          </thead>
          <tbody>
            {event.registrations.map((item) => (
              <tr className="border-t border-border/60" key={item.id}>
                <td className="px-4 py-3">{item.user?.name ?? item.user?.email ?? "Guest"}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{item.status}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{item.paymentStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
