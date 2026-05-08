"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export type TrainerPayload = {
  email: string;
  nameEn: string;
  nameAr: string;
  specializationEn: string;
  specializationAr: string;
  bioEn: string;
  bioAr: string;
  imageUrl: string;
};

export async function fetchTrainerMediaAction(): Promise<{ id: string; originalName: string; url: string }[]> {
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
  return {};
}

export async function createTrainer(
  payload: TrainerPayload,
  locale: string,
): Promise<{ error?: string }> {
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
  } catch {
    return { error: "Failed to create trainer." };
  }
}

export async function updateTrainer(
  id: string,
  payload: TrainerPayload,
  locale: string,
): Promise<{ error?: string }> {
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
  } catch {
    return { error: "Failed to update trainer." };
  }
}

export async function deleteTrainer(
  id: string,
  locale: string,
): Promise<{ error?: string }> {
  try {
    await db.trainer.delete({ where: { id } });
    revalidatePath(`/${locale}/dashboard/trainers`);
    revalidatePath(`/${locale}/dashboard/programs`);
    revalidatePath(`/${locale}/events`);
    revalidatePath(`/${locale}/training-courses`);
    return {};
  } catch {
    return { error: "Failed to delete trainer." };
  }
}

export async function saveTrainerOrder(
  ids: string[],
  locale: string,
): Promise<{ error?: string }> {
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
  } catch {
    return { error: "Failed to save trainer order." };
  }
}
