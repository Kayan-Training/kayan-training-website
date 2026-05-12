"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import type { EventFormValues } from "./_components/event-form";

export async function fetchMediaAction(): Promise<{ id: string; originalName: string; url: string; mimeType: string }[]> {
  const items = await db.media.findMany({
    where: { mimeType: { startsWith: "image/" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, originalName: true, url: true, mimeType: true },
  });
  return items;
}

export async function fetchGalleryMediaAction(): Promise<{ id: string; originalName: string; url: string; mimeType: string }[]> {
  const items = await db.media.findMany({
    where: {
      OR: [
        { mimeType: { startsWith: "image/" } },
        { mimeType: { startsWith: "video/" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, originalName: true, url: true, mimeType: true },
  });
  return items;
}

export async function fetchMediaPageAction(
  page = 1,
  pageSize = 24,
): Promise<{
  items: { id: string; originalName: string; url: string; mimeType: string }[];
  page: number;
  totalPages: number;
  total: number;
}> {
  const safePageSize = Math.max(1, Math.min(60, pageSize));
  const safePage = Math.max(1, page);
  const where = { mimeType: { startsWith: "image/" as const } };
  const total = await db.media.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(safePage, totalPages);
  const items = await db.media.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: { id: true, originalName: true, url: true, mimeType: true },
    skip: (currentPage - 1) * safePageSize,
    take: safePageSize,
  });
  return { items, page: currentPage, totalPages, total };
}

export async function fetchGalleryMediaPageAction(
  page = 1,
  pageSize = 24,
): Promise<{
  items: { id: string; originalName: string; url: string; mimeType: string }[];
  page: number;
  totalPages: number;
  total: number;
}> {
  const safePageSize = Math.max(1, Math.min(60, pageSize));
  const safePage = Math.max(1, page);
  const where = {
    OR: [
      { mimeType: { startsWith: "image/" as const } },
      { mimeType: { startsWith: "video/" as const } },
    ],
  };
  const total = await db.media.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(safePage, totalPages);
  const items = await db.media.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: { id: true, originalName: true, url: true, mimeType: true },
    skip: (currentPage - 1) * safePageSize,
    take: safePageSize,
  });
  return { items, page: currentPage, totalPages, total };
}

export async function updateEventAction(
  id: string,
  locale: string,
  values: EventFormValues,
): Promise<{ error?: string }> {
  try {
    await db.event.update({
      where: { id },
      data: {
        slug: values.slug,
        status: values.status,
        eventKind: values.eventKind,
        type: values.type,
        language: values.language,
        coverImage: values.coverImage || null,
        location: values.location || null,
        capacity: values.capacity ? Number(values.capacity) : null,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        registrationDeadline: values.registrationDeadline ? new Date(values.registrationDeadline) : null,
        price: values.price,
        isFree: values.isFree,
        isFeatured: values.isFeatured,
        isCertified: values.isCertified,
        registrationsOpen: values.registrationsOpen,
        registrationType: values.registrationType,
        externalRegistrationUrl:
          values.registrationType === "external"
            ? (values.externalRegistrationUrl || null)
            : null,
        meetingLink: values.meetingLink || null,
        meetingPlatform: values.meetingLink ? values.meetingPlatform : null,
        paymentMethods: values.paymentMethods,
        bankTransferDetails: {
          payment: {
            bankName: values.bankName || null,
            accountName: values.bankAccountName || null,
            iban: values.bankIban || null,
            swift: values.bankSwift || null,
            instructions: {
              en: values.bankInstructionsEn || null,
              ar: values.bankInstructionsAr || null,
            },
          },
          gallery: {
            mode: values.galleryMode,
            mediaIds: values.galleryMediaIds,
          },
          hero: {
            programLogo: values.heroProgramLogo || null,
            collaboratorLogos: values.heroCollaboratorLogos
              .split("\n")
              .map((value) => value.trim())
              .filter(Boolean),
            featuredStats: {
              sessions: values.featuredSessionsStat.trim() || null,
              fullDay: values.featuredFullDayStat.trim() || null,
            },
            tags: {
              en: values.heroTagsEn
                .split("\n")
                .map((value) => value.trim())
                .filter(Boolean),
              ar: values.heroTagsAr
                .split("\n")
                .map((value) => value.trim())
                .filter(Boolean),
            },
            peopleLabel: {
              en: values.heroPeopleLabelEn.trim() || null,
              ar: values.heroPeopleLabelAr.trim() || null,
            },
          },
          ui: {
            sidebar: {
              showSeatsFulfillment: values.showSidebarSeatsFulfillment,
              showPayment: values.showSidebarPayment,
            },
          },
        },
        showMapEmbed: values.showMapEmbed,
        googleMapsLink: values.googleMapsLink || null,
      },
    });

    await db.eventTranslation.upsert({
      where: { eventId_locale: { eventId: id, locale: "en" } },
      create: {
        eventId: id,
        locale: "en",
        title: values.titleEn,
        shortDescription: values.shortEn || null,
        description: values.contentEn ? { html: values.contentEn, type: "html" } : undefined,
        seoTitle: values.seoTitleEn || null,
        seoDescription: values.seoDescriptionEn || null,
      },
      update: {
        title: values.titleEn,
        shortDescription: values.shortEn || null,
        description: values.contentEn ? { html: values.contentEn, type: "html" } : undefined,
        seoTitle: values.seoTitleEn || null,
        seoDescription: values.seoDescriptionEn || null,
      },
    });

    await db.eventTranslation.upsert({
      where: { eventId_locale: { eventId: id, locale: "ar" } },
      create: {
        eventId: id,
        locale: "ar",
        title: values.titleAr,
        shortDescription: values.shortAr || null,
        description: values.contentAr ? { html: values.contentAr, type: "html" } : undefined,
        seoTitle: values.seoTitleAr || null,
        seoDescription: values.seoDescriptionAr || null,
      },
      update: {
        title: values.titleAr,
        shortDescription: values.shortAr || null,
        description: values.contentAr ? { html: values.contentAr, type: "html" } : undefined,
        seoTitle: values.seoTitleAr || null,
        seoDescription: values.seoDescriptionAr || null,
      },
    });

    await db.eventTrainer.deleteMany({ where: { eventId: id } });
    if (values.trainerIds.length > 0) {
      await db.eventTrainer.createMany({
        data: values.trainerIds.map((trainerId, i) => ({ eventId: id, trainerId, sortOrder: i })),
      });
    }

    await db.agendaSession.deleteMany({ where: { eventId: id } });
    if (values.agenda.length > 0) {
      await db.agendaSession.createMany({
        data: values.agenda.map((item, i) => ({
          eventId: id,
          day: item.day,
          time: item.time,
          title: item.title,
          type: item.type,
          trainerId: item.trainerId || null,
          order: i,
        })),
      });
    }

    await db.eventCategory.deleteMany({ where: { eventId: id } });
    if (values.categories.length > 0) {
      await db.eventCategory.createMany({
        data: values.categories.map((categoryId) => ({ eventId: id, categoryId })),
      });
    }

    await db.registrationFormField.deleteMany({ where: { eventId: id } });
    for (let i = 0; i < values.registrationFields.length; i++) {
      const field = values.registrationFields[i];
      await db.registrationFormField.create({
        data: {
          eventId: id,
          type: field.type,
          required: field.required,
          order: i,
          translations: {
            create: [
              { locale: "en", label: field.labelEn, placeholder: field.placeholderEn || null },
              { locale: "ar", label: field.labelAr, placeholder: field.placeholderAr || null },
            ],
          },
        },
      });
    }

    revalidatePath(`/${locale}/dashboard/programs`);
    revalidatePath(`/${locale}/events`);
    revalidatePath(`/${locale}/training-courses`);
    revalidatePath(`/${locale}/events/${values.slug}`);
    revalidatePath(`/${locale}/training-courses/${values.slug}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save event" };
  }
}

export async function createEventAction(
  locale: string,
  values: EventFormValues,
): Promise<{ error?: string }> {
  let createdId: string;
  try {
    const created = await db.event.create({
      data: {
        slug: values.slug,
        status: values.status,
        eventKind: values.eventKind,
        type: values.type,
        language: values.language,
        coverImage: values.coverImage || null,
        location: values.location || null,
        capacity: values.capacity ? Number(values.capacity) : null,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        registrationDeadline: values.registrationDeadline ? new Date(values.registrationDeadline) : null,
        price: values.price,
        isFree: values.isFree,
        isFeatured: values.isFeatured,
        isCertified: values.isCertified,
        registrationsOpen: values.registrationsOpen,
        registrationType: values.registrationType,
        externalRegistrationUrl:
          values.registrationType === "external"
            ? (values.externalRegistrationUrl || null)
            : null,
        meetingLink: values.meetingLink || null,
        meetingPlatform: values.meetingLink ? values.meetingPlatform : null,
        paymentMethods: values.paymentMethods,
        bankTransferDetails: {
          payment: {
            bankName: values.bankName || null,
            accountName: values.bankAccountName || null,
            iban: values.bankIban || null,
            swift: values.bankSwift || null,
            instructions: {
              en: values.bankInstructionsEn || null,
              ar: values.bankInstructionsAr || null,
            },
          },
          gallery: {
            mode: values.galleryMode,
            mediaIds: values.galleryMediaIds,
          },
          hero: {
            programLogo: values.heroProgramLogo || null,
            collaboratorLogos: values.heroCollaboratorLogos
              .split("\n")
              .map((value) => value.trim())
              .filter(Boolean),
            featuredStats: {
              sessions: values.featuredSessionsStat.trim() || null,
              fullDay: values.featuredFullDayStat.trim() || null,
            },
            tags: {
              en: values.heroTagsEn
                .split("\n")
                .map((value) => value.trim())
                .filter(Boolean),
              ar: values.heroTagsAr
                .split("\n")
                .map((value) => value.trim())
                .filter(Boolean),
            },
            peopleLabel: {
              en: values.heroPeopleLabelEn.trim() || null,
              ar: values.heroPeopleLabelAr.trim() || null,
            },
          },
          ui: {
            sidebar: {
              showSeatsFulfillment: values.showSidebarSeatsFulfillment,
              showPayment: values.showSidebarPayment,
            },
          },
        },
        showMapEmbed: values.showMapEmbed,
        googleMapsLink: values.googleMapsLink || null,
        translations: {
          create: [
            {
              locale: "en",
              title: values.titleEn,
              shortDescription: values.shortEn || null,
              description: values.contentEn ? { html: values.contentEn, type: "html" } : undefined,
              seoTitle: values.seoTitleEn || null,
              seoDescription: values.seoDescriptionEn || null,
            },
            {
              locale: "ar",
              title: values.titleAr,
              shortDescription: values.shortAr || null,
              description: values.contentAr ? { html: values.contentAr, type: "html" } : undefined,
              seoTitle: values.seoTitleAr || null,
              seoDescription: values.seoDescriptionAr || null,
            },
          ],
        },
        trainers:
          values.trainerIds.length > 0
            ? { create: values.trainerIds.map((trainerId, i) => ({ trainerId, sortOrder: i })) }
            : undefined,
        agendaSessions:
          values.agenda.length > 0
            ? {
                create: values.agenda.map((item, i) => ({
                  day: item.day,
                  time: item.time,
                  title: item.title,
                  type: item.type,
                  trainerId: item.trainerId || null,
                  order: i,
                })),
              }
            : undefined,
        categories:
          values.categories.length > 0
            ? { create: values.categories.map((categoryId) => ({ categoryId })) }
            : undefined,
      },
    });
    createdId = created.id;
    revalidatePath(`/${locale}/dashboard/programs`);
    revalidatePath(`/${locale}/events`);
    revalidatePath(`/${locale}/training-courses`);
    revalidatePath(`/${locale}/events/${values.slug}`);
    revalidatePath(`/${locale}/training-courses/${values.slug}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create event" };
  }
  redirect(`/${locale}/dashboard/programs/${createdId}`);
}

export async function deleteProgramsAction(
  locale: string,
  ids: string[],
): Promise<{ error?: string }> {
  if (!ids.length) return { error: "No programs selected." };
  try {
    await db.event.deleteMany({
      where: { id: { in: ids } },
    });
    revalidatePath(`/${locale}/dashboard/programs`);
    revalidatePath(`/${locale}/events`);
    revalidatePath(`/${locale}/training-courses`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete programs." };
  }
}

