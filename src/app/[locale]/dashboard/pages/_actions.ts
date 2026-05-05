"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { isSystemPage } from "@/lib/pages/block-types";

export async function fetchMediaAction(): Promise<{ id: string; originalName: string; url: string; mimeType: string }[]> {
  const items = await db.media.findMany({
    select: { id: true, originalName: true, url: true, mimeType: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return items.map((m) => ({ id: m.id, originalName: m.originalName, url: m.url, mimeType: m.mimeType }));
}

export async function updatePageAction(
  id: string,
  locale: string,
  values: {
    status: string;
    titleEn: string;
    titleAr: string;
    seoTitleEn: string;
    seoTitleAr: string;
    seoDescriptionEn: string;
    seoDescriptionAr: string;
    blocksEn: unknown;
    blocksAr: unknown;
  },
): Promise<{ error?: string }> {
  try {
    await db.page.update({ where: { id }, data: { status: values.status } });

    await db.pageTranslation.upsert({
      where: { pageId_locale: { pageId: id, locale: "en" } },
      create: {
        pageId: id,
        locale: "en",
        title: values.titleEn,
        seoTitle: values.seoTitleEn || null,
        seoDescription: values.seoDescriptionEn || null,
        blocks: values.blocksEn ?? undefined,
      },
      update: {
        title: values.titleEn,
        seoTitle: values.seoTitleEn || null,
        seoDescription: values.seoDescriptionEn || null,
        blocks: values.blocksEn ?? undefined,
      },
    });

    await db.pageTranslation.upsert({
      where: { pageId_locale: { pageId: id, locale: "ar" } },
      create: {
        pageId: id,
        locale: "ar",
        title: values.titleAr,
        seoTitle: values.seoTitleAr || null,
        seoDescription: values.seoDescriptionAr || null,
        blocks: values.blocksAr ?? undefined,
      },
      update: {
        title: values.titleAr,
        seoTitle: values.seoTitleAr || null,
        seoDescription: values.seoDescriptionAr || null,
        blocks: values.blocksAr ?? undefined,
      },
    });

    revalidatePath(`/${locale}/dashboard/pages`);
    revalidatePath(`/${locale}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save page" };
  }
}

export async function createPageAction(locale: string, formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  if (!slug || !titleEn || !titleAr) return;
  await db.page.create({
    data: {
      slug,
      status: "draft",
      translations: {
        create: [
          { locale: "en", title: titleEn },
          { locale: "ar", title: titleAr },
        ],
      },
    },
  });
  revalidatePath(`/${locale}/dashboard/pages`);
  redirect(`/${locale}/dashboard/pages/${slug}`);
}

export async function deletePageAction(locale: string, id: string): Promise<{ error?: string }> {
  try {
    const page = await db.page.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });

    if (!page) return { error: "Page not found" };
    if (isSystemPage(page.slug)) return { error: "System pages cannot be deleted" };

    await db.page.delete({ where: { id: page.id } });

    revalidatePath(`/${locale}/dashboard/pages`);
    revalidatePath(`/${locale}/${page.slug}`);
    return {};
  } catch {
    return { error: "Failed to delete page" };
  }
}
