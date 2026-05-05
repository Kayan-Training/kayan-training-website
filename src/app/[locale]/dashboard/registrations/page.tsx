import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { OpenCreateRegistrationButton } from "./open-create-registration-button";

import { RegistrationsTable, type RegistrationRow } from "./registrations-table";

export const metadata = { title: "Registrations" };

export default async function RegistrationsDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ create?: string }>;
}) {
  const { locale } = await params;
  const { create } = await searchParams;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const [registrations, events] = await Promise.all([
    db.registration.findMany({
      include: {
        event: { include: { translations: { where: { locale: activeLocale }, take: 1 } } },
        user: { select: { email: true, name: true } },
        payment: { select: { proofUrl: true, reference: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.event.findMany({
      include: {
        registrations: { select: { id: true } },
        formFields: {
          include: {
            translations: {
              where: { locale: activeLocale },
              take: 1,
            },
          },
          orderBy: { order: "asc" },
        },
        translations: {
          where: { locale: activeLocale },
          take: 1,
        },
      },
      orderBy: { startDate: "desc" },
    }),
  ]);
  const total = registrations.length;
  const pending = registrations.filter((r) => r.status === "pending").length;
  const confirmed = registrations.filter((r) => r.status === "confirmed").length;
  const cancelled = registrations.filter((r) => r.status === "cancelled").length;

  const rows: RegistrationRow[] = registrations.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    eventTitle: r.event.translations[0]?.title ?? r.event.slug,
    eventStartDate: r.event.startDate,
    eventEndDate: r.event.endDate,
    registrantName: r.user?.name ?? r.user?.email ?? "Guest",
    registrantEmail: r.user?.email ?? "",
    formData:
      r.formData && typeof r.formData === "object" && !Array.isArray(r.formData)
        ? (r.formData as Record<string, unknown>)
        : null,
    status: r.status,
    paymentStatus: r.paymentStatus,
    paymentMethod: r.paymentMethod,
    paymentProofUrl: r.payment?.proofUrl ?? null,
    paymentRef: r.payment?.reference ?? null,
    amount: r.amount?.toString() ?? null,
    createdAt: r.createdAt,
    locale: activeLocale,
  }));
  const eventOptions = events.map((event) => ({
    id: event.id,
    title: event.translations[0]?.title ?? event.slug,
    startDate: event.startDate,
    endDate: event.endDate,
    imageUrl: event.coverImage ?? null,
    location: event.location ?? null,
    price: Number(event.price),
    currency: "OMR",
    totalSeats: event.capacity ?? null,
    remainingSeats:
      event.capacity != null ? Math.max(event.capacity - event.registrations.length, 0) : null,
    formSchema: event.formFields.map((field) => {
      const optionPayload =
        field.options && typeof field.options === "object"
          ? (field.options as { choices?: unknown })
          : {};
      const localeChoices = (optionPayload.choices as { ar?: unknown; en?: unknown } | undefined) ?? {};
      const choices = Array.isArray(localeChoices[activeLocale])
        ? (localeChoices[activeLocale] as string[])
        : Array.isArray(optionPayload.choices)
          ? (optionPayload.choices as string[])
          : [];
      return {
        key: field.id,
        label: field.translations[0]?.label ?? "Field",
        type: field.type as
          | "text"
          | "email"
          | "tel"
          | "number"
          | "textarea"
          | "select"
          | "checkbox"
          | "radio"
          | "date",
        required: field.required,
        placeholder: field.translations[0]?.placeholder ?? "",
        options: choices,
      };
    }),
  }));

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Registrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review submissions, payment checks, and status transitions.
          </p>
        </div>
        <OpenCreateRegistrationButton />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total
          </p>
          <p className="text-lg font-semibold">{total}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pending
          </p>
          <p className="text-lg font-semibold">{pending}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Confirmed
          </p>
          <p className="text-lg font-semibold">{confirmed}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Cancelled
          </p>
          <p className="text-lg font-semibold">{cancelled}</p>
        </div>
      </div>
      <RegistrationsTable
        eventOptions={eventOptions}
        initialCreateOpen={create === "1"}
        locale={activeLocale}
        registrations={rows}
      />
    </section>
  );
}
