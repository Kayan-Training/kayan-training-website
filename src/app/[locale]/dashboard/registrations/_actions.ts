"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export async function bulkUpdateRegistrationStatus(
  ids: string[],
  status: string,
  locale: string,
): Promise<{ error?: string }> {
  try {
    await db.registration.updateMany({ where: { id: { in: ids } }, data: { status } });
    revalidatePath(`/${locale}/dashboard/registrations`);
    return {};
  } catch {
    return { error: "Failed to bulk update" };
  }
}

export async function deleteRegistrations(
  ids: string[],
  locale: string,
): Promise<{ error?: string }> {
  try {
    await db.registration.deleteMany({ where: { id: { in: ids } } });
    revalidatePath(`/${locale}/dashboard/registrations`);
    return {};
  } catch {
    return { error: "Failed to delete registrations" };
  }
}
