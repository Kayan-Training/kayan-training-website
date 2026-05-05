import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/mailer";
import {
  bankTransferPendingTemplate,
  registrationConfirmationTemplate,
} from "@/lib/email/templates";

export async function hasExistingRegistrationForEmail(eventId: string, email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  const result = await db.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM "Registration" r
      LEFT JOIN "User" u ON u.id = r."userId"
      WHERE r."eventId" = ${eventId}
        AND r."cancelledAt" IS NULL
        AND (
          LOWER(COALESCE(u.email, '')) = ${normalizedEmail}
          OR LOWER(COALESCE(r."formData"->>'email', '')) = ${normalizedEmail}
        )
    ) AS "exists"
  `;

  return Boolean(result[0]?.exists);
}

export async function createRegistration(input: {
  amount: string;
  eventId: string;
  extraFormData?: Record<string, string>;
  locale: "ar" | "en";
  paymentMethod: "bank" | "card" | "free";
  registrantEmail: string;
  registrantName: string;
  userId?: string;
}) {
  const amountNumber = Number(input.amount || "0");
  const amount = Number.isFinite(amountNumber) ? amountNumber : 0;
  const event = await db.event.findUnique({
    include: {
      registrations: { select: { id: true } },
      translations: {
        take: 1,
        where: { locale: input.locale },
      },
    },
    where: { id: input.eventId },
  });

  if (!event) {
    throw new Error("Event not found.");
  }
  if (!event.registrationsOpen) {
    throw new Error("Registrations are closed.");
  }
  if (event.registrationDeadline && event.registrationDeadline < new Date()) {
    throw new Error("Registration deadline passed.");
  }
  if (event.capacity && event.registrations.length >= event.capacity) {
    await db.event.update({
      data: { registrationsOpen: false },
      where: { id: event.id },
    });
    throw new Error("Event capacity reached.");
  }
  if (await hasExistingRegistrationForEmail(input.eventId, input.registrantEmail)) {
    throw new Error("A registration already exists for this email.");
  }

  const registration = await db.registration.create({
    data: {
      amount,
      eventId: input.eventId,
      formData: {
        email: input.registrantEmail,
        emailNormalized: input.registrantEmail.trim().toLowerCase(),
        locale: input.locale,
        name: input.registrantName,
        ...(input.extraFormData ?? {}),
      },
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "free" ? "paid" : "pending",
      status: input.paymentMethod === "free" ? "confirmed" : "submitted",
      userId: input.userId ?? null,
    },
  });

  await db.payment.create({
    data: {
      method: input.paymentMethod,
      registrationId: registration.id,
      status: input.paymentMethod === "free" ? "paid" : "pending",
    },
  });

  if (event.capacity) {
    const total = await db.registration.count({
      where: { eventId: event.id },
    });
    if (total >= event.capacity && event.registrationsOpen) {
      await db.event.update({
        data: { registrationsOpen: false },
        where: { id: event.id },
      });
    }
  }

  const eventTitle = event?.translations[0]?.title ?? event?.slug ?? "Event";
  const mail = registrationConfirmationTemplate({
    eventTitle,
    locale: input.locale,
    registrantName: input.registrantName,
  });

  await sendEmail({ html: mail.html, subject: mail.subject, text: mail.text, to: input.registrantEmail });

  if (input.paymentMethod === "bank") {
    const pending = bankTransferPendingTemplate({
      eventTitle,
      locale: input.locale,
      registrantName: input.registrantName,
    });
    await sendEmail({
      html: pending.html,
      subject: pending.subject,
      text: pending.text,
      to: input.registrantEmail,
    });
  }

  return registration;
}
