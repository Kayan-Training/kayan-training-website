"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export async function createCategory(
  slug: string,
  nameEn: string,
  nameAr: string,
  icon: string,
  color: string,
  locale: string,
): Promise<{ error?: string }> {
  if (!slug || !nameEn || !nameAr) return { error: "Slug and names required" };
  try {
    await db.category.create({
      data: {
        slug,
        icon: icon || "tag",
        color: color || "#888888",
        translations: {
          create: [
            { locale: "en", name: nameEn },
            { locale: "ar", name: nameAr },
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

export async function deleteCategory(id: string, locale: string): Promise<{ error?: string }> {
  try {
    await db.category.delete({ where: { id } });
    revalidatePath(`/${locale}/dashboard/categories`);
    return {};
  } catch {
    return { error: "Failed to delete category" };
  }
}
