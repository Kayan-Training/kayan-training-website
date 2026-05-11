import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

export function hasResendConfig() {
  return Boolean(resendApiKey);
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendEmail({
  html,
  replyTo,
  subject,
  text,
  to,
}: {
  html: string;
  replyTo?: string;
  subject: string;
  text: string;
  to: string;
}) {
  if (!hasResendConfig() || !resend) {
    return { skipped: true as const };
  }

  const from = process.env.EMAIL_FROM ?? "no-reply@kayan.om";
  const { error } = await resend.emails.send({
    from,
    html,
    subject,
    text,
    to,
    replyTo,
  });
  if (error) {
    throw new Error(error.message);
  }

  return { skipped: false as const };
}
