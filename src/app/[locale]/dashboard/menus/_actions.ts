"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export async function createMenuItem(
  menuId: string,
  url: string,
  labelEn: string,
  labelAr: string,
  order: number,
  locale: string,
): Promise<{ error?: string }> {
  if (!url || !labelEn || !labelAr) return { error: "URL and labels required" };
  try {
    await db.menuItem.create({
      data: {
        menuId,
        url,
        type: "link",
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
    return {};
  } catch {
    return { error: "Failed to create menu item" };
  }
}

export async function deleteMenuItem(id: string, locale: string): Promise<{ error?: string }> {
  try {
    await db.menuItem.delete({ where: { id } });
    revalidatePath(`/${locale}/dashboard/menus`);
    return {};
  } catch {
    return { error: "Failed to delete item" };
  }
}
