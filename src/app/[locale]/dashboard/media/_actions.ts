"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/session";
import { deleteFromS3ByKey } from "@/lib/storage/s3";

export async function deleteMedia(id: string, locale: string): Promise<{ error?: string }> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  try {
    const media = await db.media.findUnique({ where: { id } });
    if (!media) {
      return { error: "Media not found." };
    }

    await db.media.delete({ where: { id } });
    await deleteFromS3ByKey(media.filename).catch(() => undefined);

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
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
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
