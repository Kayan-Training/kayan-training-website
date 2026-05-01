"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export async function deleteMedia(id: string, locale: string): Promise<{ error?: string }> {
  try {
    await db.media.delete({ where: { id } });
    revalidatePath(`/${locale}/dashboard/media`);
    return {};
  } catch {
    return { error: "Failed to delete. The file may be in use." };
  }
}
