import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { OpenCreateRegistrationButton } from "../open-create-registration-button";

import { RegistrationsTable, type RegistrationRow } from "../registrations-table";

export default async function EventRegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; eventId: string }>;
  searchParams: Promise<{ create?: string }>;
}) {
  const { locale, eventId } = await params;
  const { create } = await searchParams;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      translations: { where: { locale: activeLocale }, take: 1 },
      formFields: {
        include: {
          translations: {
            where: { locale: activeLocale },
            take: 1,
          },
        },
        orderBy: { order: "asc" },
      },
      registrations: {
        include: {
          user: { select: { email: true, name: true } },
          payment: { select: { proofUrl: true, reference: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!event) notFound();

  const eventTitle = event.translations[0]?.title ?? event.slug;

  const rows: RegistrationRow[] = event.registrations.map((r) => {
    const formDataObject =
      r.formData && typeof r.formData === "object" && !Array.isArray(r.formData)
        ? (r.formData as Record<string, unknown>)
        : {};
    return {
    id: r.id,
    eventId: event.id,
    eventTitle,
    eventStartDate: event.startDate,
    eventEndDate: event.endDate,
    registrantName: r.user?.name ?? (typeof formDataObject.name === "string" ? formDataObject.name : r.user?.email ?? "Guest"),
    registrantEmail: r.user?.email ?? (typeof formDataObject.email === "string" ? formDataObject.email : ""),
    formData:
      Object.keys(formDataObject).length > 0 ? formDataObject : null,
    status: r.status,
    paymentStatus: r.paymentStatus,
    paymentMethod: r.paymentMethod,
    paymentProofUrl: r.payment?.proofUrl ?? null,
    paymentRef: r.payment?.reference ?? null,
    amount: r.amount?.toString() ?? null,
    createdAt: r.createdAt,
    locale: activeLocale,
  };
  });
  const eventOptions = [
    {
      id: event.id,
      title: eventTitle,
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
    },
  ];
  const total = rows.length;
  const pending = rows.filter((r) => r.status === "pending").length;
  const confirmed = rows.filter((r) => r.status === "confirmed").length;
  const cancelled = rows.filter((r) => r.status === "cancelled").length;

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{eventTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Event-specific registration and payment review.
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
        fixedEventId={event.id}
        initialCreateOpen={create === "1"}
        locale={activeLocale}
        registrations={rows}
      />
    </section>
  );
}
