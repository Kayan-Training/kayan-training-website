"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export async function verifyPayment(
  registrationId: string,
  note: string,
  locale: string,
): Promise<{ error?: string }> {
  try {
    await db.registration.update({
      where: { id: registrationId },
      data: { status: "confirmed", paymentStatus: "paid", verificationNote: note || null },
    });
    await db.payment.updateMany({
      where: { registrationId },
      data: { status: "verified", verifiedAt: new Date() },
    });
    revalidatePath(`/${locale}/dashboard/registrations`);
    return {};
  } catch {
    return { error: "Failed to verify payment" };
  }
}

export async function rejectPayment(
  registrationId: string,
  reason: string,
  locale: string,
): Promise<{ error?: string }> {
  try {
    await db.registration.update({
      where: { id: registrationId },
      data: { status: "cancelled", paymentStatus: "failed", cancellationReason: reason || null },
    });
    await db.payment.updateMany({
      where: { registrationId },
      data: { status: "failed" },
    });
    revalidatePath(`/${locale}/dashboard/registrations`);
    return {};
  } catch {
    return { error: "Failed to reject payment" };
  }
}

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
