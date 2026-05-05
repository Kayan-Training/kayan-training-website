import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { hasExistingRegistrationForEmail } from "@/lib/registrations/service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const email = request.nextUrl.searchParams.get("email")?.trim() ?? "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const event = await db.event.findUnique({
    select: { id: true },
    where: { slug },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const exists = await hasExistingRegistrationForEmail(event.id, email);
  return NextResponse.json({ exists });
}
