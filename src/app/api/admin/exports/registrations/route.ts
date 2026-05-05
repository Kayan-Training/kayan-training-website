/**
 * Registration export route (CSV).
 */
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/session";

function toCsv(rows: Array<Record<string, string>>) {
  if (!rows.length) {
    return "event_name,event_start_date,event_end_date,registrant_name,registrant_email,payment_method,payment_status,amount,status,created_at,confirmed_at,cancelled_at,cancellation_reason,form_data";
  }

  const headers = Object.keys(rows[0]);
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header] ?? "")).join(","));
  }

  return lines.join("\n");
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");

  const registrations = await db.registration.findMany({
    where: eventId ? { eventId } : undefined,
    include: {
      event: {
        include: {
          translations: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      payment: {
        select: {
          verifiedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const dynamicFormKeys = new Set<string>();
  for (const row of registrations) {
    if (row.formData && typeof row.formData === "object" && !Array.isArray(row.formData)) {
      for (const key of Object.keys(row.formData as Record<string, unknown>)) {
        dynamicFormKeys.add(key);
      }
    }
  }
  const orderedDynamicKeys = [...dynamicFormKeys].sort((a, b) =>
    a.localeCompare(b),
  );

  const csvRows = registrations.map((row) => {
    const eventTitle =
      row.event.translations.find((t) => t.locale === "en")?.title ??
      row.event.translations[0]?.title ??
      row.event.slug;
    const formDataObject =
      row.formData && typeof row.formData === "object" && !Array.isArray(row.formData)
        ? (row.formData as Record<string, unknown>)
        : {};
    const registrantName =
      row.user?.name ??
      (typeof formDataObject.name === "string" ? formDataObject.name : "") ??
      "Guest";
    const registrantEmail =
      row.user?.email ??
      (typeof formDataObject.email === "string" ? formDataObject.email : "") ??
      "";
    const confirmedAt =
      row.payment?.verifiedAt ??
      (row.status === "confirmed" && row.paymentMethod === "free"
        ? row.createdAt
        : null);

    const base: Record<string, string> = {
      event_name: eventTitle,
      event_start_date: row.event.startDate.toISOString(),
      event_end_date: row.event.endDate.toISOString(),
      registrant_name: registrantName,
      registrant_email: registrantEmail,
      payment_method: row.paymentMethod,
      payment_status: row.paymentStatus,
      amount: row.amount.toString(),
      status: row.status,
      created_at: row.createdAt.toISOString(),
      confirmed_at: confirmedAt?.toISOString() ?? "",
      cancelled_at: row.cancelledAt?.toISOString() ?? "",
      cancellation_reason: row.cancellationReason ?? "",
      form_data: JSON.stringify(formDataObject),
    };

    for (const key of orderedDynamicKeys) {
      const value = formDataObject[key];
      base[`form_${key}`] =
        value == null
          ? ""
          : typeof value === "string"
            ? value
            : JSON.stringify(value);
    }

    return base;
  });

  const csv = toCsv(csvRows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations${eventId ? `-${eventId}` : ""}.csv"`,
    },
  });
}
