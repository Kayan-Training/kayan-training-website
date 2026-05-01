import Link from "next/link";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

export default async function RegistrationsDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const registrations = await db.registration.findMany({
    include: {
      event: {
        include: {
          translations: {
            where: { locale: activeLocale },
            take: 1,
          },
        },
      },
      user: {
        select: { email: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">{activeLocale === "ar" ? "التسجيلات" : "Registrations"}</h1>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Event</th>
              <th className="px-4 py-3 text-left">Registrant</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Payment</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((registration) => (
              <tr className="border-t border-border/60" key={registration.id}>
                <td className="px-4 py-3">
                  <Link className="font-medium hover:text-primary" href={`/${activeLocale}/dashboard/events/${registration.eventId}`}>
                    {registration.event.translations[0]?.title ?? registration.event.slug}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{registration.user?.name ?? registration.user?.email ?? "Guest"}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{registration.status}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{registration.paymentStatus}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Intl.DateTimeFormat(activeLocale === "ar" ? "ar-OM" : "en-GB", { dateStyle: "medium" }).format(registration.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
