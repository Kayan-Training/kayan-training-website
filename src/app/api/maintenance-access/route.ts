import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getServerSession();
    const canAccessFrontend = session?.user?.role === "admin";
    return NextResponse.json({ canAccessFrontend });
  } catch {
    return NextResponse.json({ canAccessFrontend: false });
  }
}
