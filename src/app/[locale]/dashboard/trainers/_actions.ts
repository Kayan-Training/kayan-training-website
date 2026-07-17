"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/session";

export type TrainerPayload = {
  email: string;
  nameEn: string;
  nameAr: string;
  specializationEn: string;
  specializationAr: string;
  bioEn: string;
  bioAr: string;
  imageUrl: string;
  links: string[];
};

export async function fetchTrainerMediaAction(): Promise<{ id: string; originalName: string; url: string }[]> {
  const session = await requireAdminSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  const media = await db.media.findMany({
    where: { mimeType: { startsWith: "image/" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, originalName: true, url: true },
  });
  return media;
}

function validateTrainer(payload: TrainerPayload): { error?: string } {
  if (!payload.nameEn.trim() || !payload.nameAr.trim()) {
    return { error: "English and Arabic names are required." };
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return { error: "Invalid email format." };
  }
  if (payload.links.some((link) => !link.trim())) {
    return { error: "Trainer links cannot be empty." };
  }
  return {};
}

function sanitizeLinks(links: string[]): string[] {
  return links.map((link) => link.trim()).filter(Boolean);
}

export async function createTrainer(
  payload: TrainerPayload,
  locale: string,
): Promise<{ error?: string }> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  const validation = validateTrainer(payload);
  if (validation.error) return validation;

  try {
    const maxSort = await db.trainer.aggregate({ _max: { sortOrder: true } });
    await db.trainer.create({
      data: {
        email: payload.email.trim() || null,
        name: payload.nameEn.trim(),
        specialization: payload.specializationEn.trim() || null,
        imageUrl: payload.imageUrl.trim() || null,
        links: sanitizeLinks(payload.links),
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
        translations: {
          create: [
            {
              locale: "en",
              name: payload.nameEn.trim(),
              title: payload.specializationEn.trim() || null,
              bio: payload.bioEn.trim() || null,
            },
            {
              locale: "ar",
              name: payload.nameAr.trim(),
              title: payload.specializationAr.trim() || null,
              bio: payload.bioAr.trim() || null,
            },
          ],
        },
      },
    });
    revalidatePath(`/${locale}/dashboard/trainers`);
    revalidatePath(`/${locale}/dashboard/programs`);
    revalidatePath(`/${locale}/events`);
    revalidatePath(`/${locale}/training-courses`);
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to create trainer. ${message}` };
  }
}

export async function updateTrainer(
  id: string,
  payload: TrainerPayload,
  locale: string,
): Promise<{ error?: string }> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  const validation = validateTrainer(payload);
  if (validation.error) return validation;

  try {
    await db.trainer.update({
      where: { id },
      data: {
        email: payload.email.trim() || null,
        name: payload.nameEn.trim(),
        specialization: payload.specializationEn.trim() || null,
        imageUrl: payload.imageUrl.trim() || null,
        links: sanitizeLinks(payload.links),
      },
    });

    await db.trainerTranslation.upsert({
      where: { trainerId_locale: { trainerId: id, locale: "en" } },
      create: {
        trainerId: id,
        locale: "en",
        name: payload.nameEn.trim(),
        title: payload.specializationEn.trim() || null,
        bio: payload.bioEn.trim() || null,
      },
      update: {
        name: payload.nameEn.trim(),
        title: payload.specializationEn.trim() || null,
        bio: payload.bioEn.trim() || null,
      },
    });

    await db.trainerTranslation.upsert({
      where: { trainerId_locale: { trainerId: id, locale: "ar" } },
      create: {
        trainerId: id,
        locale: "ar",
        name: payload.nameAr.trim(),
        title: payload.specializationAr.trim() || null,
        bio: payload.bioAr.trim() || null,
      },
      update: {
        name: payload.nameAr.trim(),
        title: payload.specializationAr.trim() || null,
        bio: payload.bioAr.trim() || null,
      },
    });

    revalidatePath(`/${locale}/dashboard/trainers`);
    revalidatePath(`/${locale}/dashboard/programs`);
    revalidatePath(`/${locale}/events`);
    revalidatePath(`/${locale}/training-courses`);
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to update trainer. ${message}` };
  }
}

export async function deleteTrainer(
  id: string,
  locale: string,
): Promise<{ error?: string }> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  try {
    await db.trainer.delete({ where: { id } });
    revalidatePath(`/${locale}/dashboard/trainers`);
    revalidatePath(`/${locale}/dashboard/programs`);
    revalidatePath(`/${locale}/events`);
    revalidatePath(`/${locale}/training-courses`);
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to delete trainer. ${message}` };
  }
}

export async function saveTrainerOrder(
  ids: string[],
  locale: string,
): Promise<{ error?: string }> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return { error: "No trainers to reorder." };
  }

  try {
    await db.$transaction(
      ids.map((id, index) => db.trainer.update({ where: { id }, data: { sortOrder: index } })),
    );
    revalidatePath(`/${locale}/dashboard/trainers`);
    revalidatePath(`/${locale}/dashboard/programs`);
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to save trainer order. ${message}` };
  }
}
