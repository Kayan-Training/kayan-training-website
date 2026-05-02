"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export async function createMenuItem(
  menuId: string,
  type: "link" | "page" | "post" | "event",
  labelEn: string,
  labelAr: string,
  url: string | null,
  targetId: string | null,
  order: number,
  locale: string,
): Promise<{ error?: string; item?: { id: string; type: string; url: string | null; targetId: string | null; labelEn: string; labelAr: string; order: number } }> {
  if (!labelEn || !labelAr) return { error: "Both labels are required." };
  if (type === "link" && !url) return { error: "URL is required for manual links." };
  if (type !== "link" && !targetId) return { error: "A target must be selected." };
  try {
    const created = await db.menuItem.create({
      data: {
        menuId,
        type,
        url: type === "link" ? url : null,
        targetId: type !== "link" ? targetId : null,
        order,
        translations: {
          create: [
            { locale: "en", label: labelEn },
            { locale: "ar", label: labelAr },
          ],
        },
      },
    });
    revalidatePath(`/${locale}/dashboard/menus`);
    return { item: { id: created.id, type, url: created.url, targetId: created.targetId, labelEn, labelAr, order } };
  } catch {
    return { error: "Failed to create menu item." };
  }
}

export async function updateMenuItem(
  id: string,
  type: "link" | "page" | "post" | "event",
  labelEn: string,
  labelAr: string,
  url: string | null,
  targetId: string | null,
  locale: string,
): Promise<{ error?: string }> {
  if (!labelEn || !labelAr) return { error: "Both labels are required." };
  if (type === "link" && !url) return { error: "URL is required for manual links." };
  if (type !== "link" && !targetId) return { error: "A target must be selected." };
  try {
    await db.menuItem.update({
      where: { id },
      data: {
        type,
        url: type === "link" ? url : null,
        targetId: type !== "link" ? targetId : null,
      },
    });
    await db.menuItemTranslation.upsert({
      where: { menuItemId_locale: { menuItemId: id, locale: "en" } },
      create: { menuItemId: id, locale: "en", label: labelEn },
      update: { label: labelEn },
    });
    await db.menuItemTranslation.upsert({
      where: { menuItemId_locale: { menuItemId: id, locale: "ar" } },
      create: { menuItemId: id, locale: "ar", label: labelAr },
      update: { label: labelAr },
    });
    revalidatePath(`/${locale}/dashboard/menus`);
    return {};
  } catch {
    return { error: "Failed to update menu item." };
  }
}

export async function deleteMenuItem(id: string, locale: string): Promise<{ error?: string }> {
  try {
    await db.menuItem.delete({ where: { id } });
    revalidatePath(`/${locale}/dashboard/menus`);
    return {};
  } catch {
    return { error: "Failed to delete item." };
  }
}

export async function reorderMenuItems(
  ids: string[],
  locale: string,
): Promise<{ error?: string }> {
  try {
    await Promise.all(ids.map((id, i) => db.menuItem.update({ where: { id }, data: { order: i } })));
    revalidatePath(`/${locale}/dashboard/menus`);
    return {};
  } catch {
    return { error: "Failed to reorder items." };
  }
}
