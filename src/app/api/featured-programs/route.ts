import { NextResponse } from "next/server";

import { getFeaturedPrograms } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") ?? "";
  const locale = isSupportedLocale(localeParam) ? localeParam : "ar";

  const events = await getFeaturedPrograms(locale, 8);

  return NextResponse.json(
    {
      events: events.map((program) => ({
        eventId: program.id,
        basePath: program.basePath,
        capacity: program.capacity,
        coverImage: program.coverImage,
        dateIso: program.startDate,
        excerpt: "",
        location: program.location,
        logo: program.logo,
        registrationsCount: program.registrationsCount,
        registrationsOpen: program.registrationsOpen,
        slug: program.slug,
        title: program.title,
        updatedAtIso: program.updatedAt,
      })),
    },
    {
      headers: {
        "cache-control": "no-store, max-age=0",
      },
    },
  );
}
