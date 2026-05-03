import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const revalidate = 30;

export async function GET() {
  try {
    const s = await db.setting.findUnique({ where: { key: "site.maintenance" } });
    const maintenance = s?.value === "1" || s?.value === 1 || s?.value === true;
    return NextResponse.json(
      { maintenance },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } },
    );
  } catch {
    return NextResponse.json({ maintenance: false });
  }
}
