/**
 * Registration export route (CSV).
 */
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/session";

function toCsv(rows: Array<Record<string, string>>) {
  if (!rows.length) {
    return "id,eventId,userId,eventKind,eventPath,status,paymentStatus,paymentMethod,amount,cancelledAt,createdAt";
  }

  const headers = Object.keys(rows[0]);
  const escape = (value: string) => {
    const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  };

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
    include: { event: { select: { slug: true, eventKind: true } } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const csv = toCsv(
    registrations.map((row) => ({
      id: row.id,
      eventId: row.eventId,
      userId: row.userId ?? "",
      eventKind: (row.event.eventKind ?? "event") as string,
      eventPath: row.event.eventKind === "training_course" ? `/training-courses/${row.event.slug}` : `/events/${row.event.slug}`,
      status: row.status,
      paymentStatus: row.paymentStatus,
      paymentMethod: row.paymentMethod,
      amount: row.amount.toString(),
      cancelledAt: row.cancelledAt?.toISOString() ?? "",
      createdAt: row.createdAt.toISOString(),
    })),
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations${eventId ? `-${eventId}` : ""}.csv"`,
    },
  });
}
