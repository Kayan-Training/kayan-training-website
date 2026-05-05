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

export async function cancelRegistration(
  id: string,
  reason: string,
  locale: string,
): Promise<{ error?: string }> {
  try {
    await db.registration.update({
      where: { id },
      data: {
        status: "cancelled",
        cancellationReason: reason || null,
      },
    });
    revalidatePath(`/${locale}/dashboard/registrations`);
    return {};
  } catch {
    return { error: "Failed to cancel registration" };
  }
}

export async function updateRegistrationAdmin(
  input: {
    id: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    paymentReference?: string;
    paymentProofUrl?: string;
    verificationNote?: string;
    cancellationReason?: string;
  },
  locale: string,
): Promise<{ error?: string }> {
  try {
    const existing = await db.registration.findUnique({
      where: { id: input.id },
      select: { eventId: true },
    });
    if (!existing) return { error: "Registration not found." };

    const isCancelled = input.status === "cancelled";
    const isPaid = input.paymentStatus === "paid";

    await db.registration.update({
      where: { id: input.id },
      data: {
        status: input.status,
        paymentStatus: input.paymentStatus,
        paymentMethod: input.paymentMethod,
        verificationNote: input.verificationNote || null,
        cancellationReason: isCancelled ? input.cancellationReason || null : null,
        cancelledAt: isCancelled ? new Date() : null,
      },
    });

    await db.payment.upsert({
      where: { registrationId: input.id },
      update: {
        method: input.paymentMethod,
        status: input.paymentStatus,
        reference: input.paymentReference || null,
        proofUrl: input.paymentProofUrl || null,
        verifiedAt: isPaid ? new Date() : null,
      },
      create: {
        registrationId: input.id,
        method: input.paymentMethod,
        status: input.paymentStatus,
        reference: input.paymentReference || null,
        proofUrl: input.paymentProofUrl || null,
        verifiedAt: isPaid ? new Date() : null,
      },
    });

    revalidatePath(`/${locale}/dashboard/registrations`);
    revalidatePath(`/${locale}/dashboard/registrations/${existing.eventId}`);
    return {};
  } catch {
    return { error: "Failed to update registration details" };
  }
}

export async function createRegistrationAdmin(
  input: {
    eventId: string;
    registrantName: string;
    registrantEmail: string;
    registrantPhone?: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    amount: string;
    paymentReference?: string;
    paymentProofUrl?: string;
    verificationNote?: string;
    cancellationReason?: string;
    formData?: Record<string, string>;
  },
  locale: string,
): Promise<{ error?: string }> {
  try {
    const event = await db.event.findUnique({
      where: { id: input.eventId },
      select: { id: true },
    });
    if (!event) return { error: "Event not found." };

    const email = input.registrantEmail.trim().toLowerCase();
    if (!email) return { error: "Registrant email is required." };

    const existingUser = await db.user.findUnique({ where: { email } });
    const user =
      existingUser ??
      (await db.user.create({
        data: {
          email,
          name: input.registrantName.trim() || null,
          role: "user",
          preferredLocale: locale === "ar" ? "ar" : "en",
        },
      }));

    const amountValue = Number.parseFloat(input.amount || "0");
    if (Number.isNaN(amountValue) || amountValue < 0) {
      return { error: "Amount must be a valid positive number." };
    }

    const isCancelled = input.status === "cancelled";
    const isPaid = input.paymentStatus === "paid" || input.paymentStatus === "verified";

    const mergedFormData: Record<string, string> = {
      ...(input.formData ?? {}),
      name: input.registrantName.trim(),
      email,
    };
    if (input.registrantPhone?.trim()) {
      mergedFormData.phone = input.registrantPhone.trim();
    }

    const created = await db.registration.create({
      data: {
        eventId: input.eventId,
        userId: user.id,
        formData: mergedFormData,
        status: input.status,
        paymentStatus: input.paymentStatus,
        paymentMethod: input.paymentMethod,
        amount: amountValue,
        verificationNote: input.verificationNote?.trim() || null,
        cancellationReason: isCancelled ? input.cancellationReason?.trim() || null : null,
        cancelledAt: isCancelled ? new Date() : null,
      },
      select: { id: true },
    });

    await db.payment.create({
      data: {
        registrationId: created.id,
        method: input.paymentMethod,
        status: input.paymentStatus,
        reference: input.paymentReference?.trim() || null,
        proofUrl: input.paymentProofUrl?.trim() || null,
        verifiedAt: isPaid ? new Date() : null,
      },
    });

    revalidatePath(`/${locale}/dashboard/registrations`);
    revalidatePath(`/${locale}/dashboard/registrations/${input.eventId}`);
    return {};
  } catch {
    return { error: "Failed to create registration." };
  }
}
