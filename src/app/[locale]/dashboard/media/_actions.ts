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

export async function upsertMediaTranslations(
  id: string,
  translations: Array<{ locale: string; title: string; altText: string; description: string }>,
  locale: string,
): Promise<{ error?: string }> {
  try {
    for (const t of translations) {
      await db.mediaTranslation.upsert({
        where: { mediaId_locale: { mediaId: id, locale: t.locale } },
        create: { mediaId: id, locale: t.locale, title: t.title, altText: t.altText, description: t.description },
        update: { title: t.title, altText: t.altText, description: t.description },
      });
    }
    revalidatePath(`/${locale}/dashboard/media`);
    return {};
  } catch {
    return { error: "Failed to save metadata." };
  }
}
