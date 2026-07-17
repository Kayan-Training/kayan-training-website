"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/session";

export async function upsertSettings(
  entries: { key: string; value: string }[],
): Promise<{ error?: string }> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  try {
    await Promise.all(
      entries.map((e) =>
        db.setting.upsert({
          where: { key: e.key },
          create: { key: e.key, value: e.value },
          update: { value: e.value },
        }),
      ),
    );
    revalidatePath("/dashboard/settings", "page");
    return {};
  } catch {
    return { error: "Failed to save settings." };
  }
}

export async function fetchSettingsMediaAction(): Promise<
  { id: string; originalName: string; url: string; mimeType?: string }[]
> {
  const session = await requireAdminSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  const media = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, originalName: true, url: true, mimeType: true },
    take: 300,
  });
  return media;
}
