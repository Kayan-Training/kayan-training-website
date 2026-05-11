import { z } from "zod";

import { db } from "@/lib/db";
import { hasResendConfig, sendEmail } from "@/lib/email/mailer";
import { contactInquiryAdminTemplate } from "@/lib/email/templates";

const payloadSchema = z.object({
  company: z.string().max(200).optional().default(""),
  email: z.string().email(),
  locale: z.enum(["ar", "en"]).default("en"),
  name: z.string().min(2).max(120),
  phone: z.string().max(60).optional().default(""),
  query: z.string().min(10).max(4000),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = payloadSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        {
          message: "Invalid form data.",
          success: false,
        },
        { status: 400 },
      );
    }

    const { company, email, locale, name, phone, query } = parsed.data;
    const [contactEmailSetting, contactPhoneSetting] = await Promise.all([
      db.setting.findUnique({
        where: { key: "contact.email" },
        select: { value: true },
      }),
      db.setting.findUnique({
        where: { key: "contact.phone" },
        select: { value: true },
      }),
    ]);
    const resolvedContactEmail =
      typeof contactEmailSetting?.value === "string" && contactEmailSetting.value.trim()
        ? contactEmailSetting.value.trim()
        : "training@kayan.om";
    const resolvedContactPhone =
      typeof contactPhoneSetting?.value === "string" && contactPhoneSetting.value.trim()
        ? contactPhoneSetting.value.trim()
        : "+968 9538 3138";

    const template = contactInquiryAdminTemplate({
      company,
      email,
      locale,
      message: query,
      name,
      phone,
      supportEmail: resolvedContactEmail,
      supportPhone: resolvedContactPhone,
    });

    await sendEmail({
      html: template.html,
      replyTo: email,
      subject: template.subject,
      text: template.text,
      to: resolvedContactEmail,
    });

    return Response.json({
      message: hasResendConfig()
        ? "Message sent successfully."
        : "Email provider is not configured. Submission accepted but not delivered.",
      success: true,
    });
  } catch {
    return Response.json(
      {
        message: "Unable to process your request.",
        success: false,
      },
      { status: 500 },
    );
  }
}
