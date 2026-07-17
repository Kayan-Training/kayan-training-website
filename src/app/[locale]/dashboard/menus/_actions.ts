"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/session";

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
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  if (!labelEn || !labelAr) return { error: "Both labels are required." };
  const normalizedUrl = url?.trim() ?? null;
  const shouldFallbackToLink = type !== "link" && !targetId && Boolean(normalizedUrl);
  const finalType = shouldFallbackToLink ? "link" : type;
  if (finalType === "link" && !normalizedUrl) return { error: "URL is required for manual links." };
  if (finalType !== "link" && !targetId) return { error: "A target must be selected." };
  try {
    const created = await db.menuItem.create({
      data: {
        menuId,
        type: finalType,
        url: finalType === "link" ? normalizedUrl : null,
        targetId: finalType !== "link" ? targetId : null,
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
    return {
      item: {
        id: created.id,
        type: finalType,
        url: created.url,
        targetId: created.targetId,
        labelEn,
        labelAr,
        order,
      },
    };
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
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  if (!labelEn || !labelAr) return { error: "Both labels are required." };
  const normalizedUrl = url?.trim() ?? null;
  const shouldFallbackToLink = type !== "link" && !targetId && Boolean(normalizedUrl);
  const finalType = shouldFallbackToLink ? "link" : type;
  if (finalType === "link" && !normalizedUrl) return { error: "URL is required for manual links." };
  if (finalType !== "link" && !targetId) return { error: "A target must be selected." };
  try {
    await db.menuItem.update({
      where: { id },
      data: {
        type: finalType,
        url: finalType === "link" ? normalizedUrl : null,
        targetId: finalType !== "link" ? targetId : null,
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
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
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
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  try {
    await Promise.all(ids.map((id, i) => db.menuItem.update({ where: { id }, data: { order: i } })));
    revalidatePath(`/${locale}/dashboard/menus`);
    return {};
  } catch {
    return { error: "Failed to reorder items." };
  }
}

export async function updateHeaderCta(
  locale: string,
  payload: { labelEn: string; labelAr: string; url: string },
): Promise<{ error?: string }> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  const labelEn = payload.labelEn.trim();
  const labelAr = payload.labelAr.trim();
  const url = payload.url.trim();
  if (!labelEn || !labelAr || !url) {
    return { error: "CTA labels and URL are required." };
  }
  try {
    await Promise.all([
      db.setting.upsert({
        where: { key: "header.cta.label.en" },
        create: { key: "header.cta.label.en", value: labelEn },
        update: { value: labelEn },
      }),
      db.setting.upsert({
        where: { key: "header.cta.label.ar" },
        create: { key: "header.cta.label.ar", value: labelAr },
        update: { value: labelAr },
      }),
      db.setting.upsert({
        where: { key: "header.cta.url" },
        create: { key: "header.cta.url", value: url },
        update: { value: url },
      }),
    ]);
    revalidatePath(`/${locale}`, "layout");
    revalidatePath(`/${locale}/dashboard/menus`);
    return {};
  } catch {
    return { error: "Failed to update header CTA." };
  }
}
