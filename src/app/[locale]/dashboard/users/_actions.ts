"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/session";

export async function setUserRole(id: string, role: string, locale: string): Promise<{ error?: string }> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  try {
    await db.user.update({ where: { id }, data: { role } });
    revalidatePath(`/${locale}/dashboard/users`);
    return {};
  } catch {
    return { error: "Failed to update role" };
  }
}

export async function toggleBanUser(
  id: string,
  banned: boolean,
  locale: string,
): Promise<{ error?: string }> {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  try {
    await db.user.update({
      where: { id },
      data: { banned, banReason: banned ? "Banned by admin" : null },
    });
    revalidatePath(`/${locale}/dashboard/users`);
    return {};
  } catch {
    return { error: "Failed to update ban status" };
  }
}
