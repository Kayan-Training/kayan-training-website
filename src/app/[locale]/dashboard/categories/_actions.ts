"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export async function fetchCategoryMediaAction(): Promise<{ id: string; originalName: string; url: string }[]> {
  const media = await db.media.findMany({
    where: { mimeType: { startsWith: "image/" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, originalName: true, url: true },
  });
  return media;
}

export async function createCategory(
  slug: string,
  nameEn: string,
  nameAr: string,
  descEn: string,
  descAr: string,
  icon: string,
  color: string,
  image: string,
  locale: string,
): Promise<{ error?: string }> {
  if (!slug || !nameEn || !nameAr) return { error: "Slug and names required" };
  try {
    await db.category.create({
      data: {
        slug,
        icon: icon || "tag",
        color: color || "#888888",
        image: image || null,
        translations: {
          create: [
            { locale: "en", name: nameEn, description: descEn || null },
            { locale: "ar", name: nameAr, description: descAr || null },
          ],
        },
      },
    });
    revalidatePath(`/${locale}/dashboard/categories`);
    return {};
  } catch {
    return { error: "Failed to create category (slug may already exist)" };
  }
}

export async function updateCategory(
  id: string,
  slug: string,
  nameEn: string,
  nameAr: string,
  descEn: string,
  descAr: string,
  icon: string,
  color: string,
  image: string,
  locale: string,
): Promise<{ error?: string }> {
  if (!slug || !nameEn || !nameAr) return { error: "Slug and names required" };
  try {
    await db.category.update({
      where: { id },
      data: { slug, icon: icon || "tag", color: color || "#888888", image: image || null },
    });
    await db.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: id, locale: "en" } },
      create: { categoryId: id, locale: "en", name: nameEn, description: descEn || null },
      update: { name: nameEn, description: descEn || null },
    });
    await db.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: id, locale: "ar" } },
      create: { categoryId: id, locale: "ar", name: nameAr, description: descAr || null },
      update: { name: nameAr, description: descAr || null },
    });
    revalidatePath(`/${locale}/dashboard/categories`);
    return {};
  } catch {
    return { error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string, locale: string): Promise<{ error?: string }> {
  try {
    await db.category.delete({ where: { id } });
    revalidatePath(`/${locale}/dashboard/categories`);
    return {};
  } catch {
    return { error: "Failed to delete category" };
  }
}

export async function saveCategoryOrder(
  ids: string[],
  locale: string,
): Promise<{ error?: string }> {
  if (!Array.isArray(ids) || ids.length === 0) return { error: "No categories to reorder." };
  try {
    const normalizedIds = Array.from(
      new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0)),
    );
    if (normalizedIds.length === 0) return { error: "No valid category IDs to save." };

    await db.setting.upsert({
      where: { key: "categories.order" },
      create: { key: "categories.order", value: normalizedIds },
      update: { value: normalizedIds },
    });
    revalidatePath(`/${locale}/dashboard/categories`);
    revalidatePath("/ar");
    revalidatePath("/en");
    return {};
  } catch {
    return { error: "Failed to save category order." };
  }
}
