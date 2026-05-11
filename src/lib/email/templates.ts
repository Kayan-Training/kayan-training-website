type Locale = "ar" | "en";

type BaseTemplateInput = {
  ctaLabel?: string;
  ctaUrl?: string;
  intro: string;
  locale: Locale;
  supportEmail?: string;
  supportPhone?: string;
  signature: string;
  subject: string;
  title: string;
};

const brand = {
  bg: "#edf3f1",
  border: "#d5e3dc",
  card: "#f8fcfa",
  footerBg: "#f2f7f4",
  headerBg: "#10221a",
  primary: "#1fa66a",
  text: "#10221a",
  textMuted: "#4b6358",
  white: "#ffffff",
};

const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

const logoUrl = `${appBaseUrl.replace(/\/$/, "")}/brand/kayan-logo.png`;
const supportEmail = process.env.EMAIL_SUPPORT ?? "training@kayan.om";
const supportPhone = process.env.EMAIL_SUPPORT_PHONE ?? "+968 0000 0000";
const websiteUrl = appBaseUrl.replace(/\/$/, "");

function withShell({
  ctaLabel,
  ctaUrl,
  intro,
  locale,
  supportEmail: footerSupportEmail,
  supportPhone: footerSupportPhone,
  signature,
  subject,
  title,
}: BaseTemplateInput) {
  const isAr = locale === "ar";
  const currentYear = new Date().getFullYear();
  const securityNote = isAr
    ? "إذا لم تكن أنت صاحب هذا الطلب، تجاهل هذا البريد. لا تشارك هذا الرابط مع أي شخص."
    : "If you did not make this request, you can ignore this email. Do not share this link with anyone.";
  const automatedNotice = isAr
    ? "هذه رسالة آلية من كيان. الرجاء عدم الرد على هذا البريد."
    : "This is an automated message from Kayan. Please do not reply to this email.";
  const supportLabel = isAr ? "الدعم" : "Support";
  const phoneLabel = isAr ? "الهاتف" : "Phone";
  const websiteLabel = isAr ? "الموقع" : "Website";
  const legalLine = isAr
    ? `© ${currentYear} كيان. جميع الحقوق محفوظة.`
    : `© ${currentYear} Kayan. All rights reserved.`;
  const resolvedSupportEmail = footerSupportEmail?.trim() || supportEmail;
  const resolvedSupportPhone = footerSupportPhone?.trim() || supportPhone;
  const html = `
    <div style="margin:0;padding:32px 16px;background:${brand.bg};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:${brand.white};border:1px solid ${brand.border};border-radius:14px;overflow:hidden;">
        <tr>
          <td style="padding:20px 24px;background:${brand.headerBg};">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td>
                  <img src="${logoUrl}" alt="Kayan" style="height:34px;width:auto;display:block;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:26px 24px;background:${brand.card};font-family:Arial,sans-serif;line-height:1.7;color:${brand.text};direction:${isAr ? "rtl" : "ltr"};text-align:${isAr ? "right" : "left"};">
            <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.4;color:${brand.text};">${title}</h1>
            <p style="margin:0 0 16px 0;color:${brand.textMuted};font-size:15px;">${intro}</p>
            ${
              ctaLabel && ctaUrl
                ? `<p style="margin:0 0 16px 0;"><a href="${ctaUrl}" style="display:inline-block;background:${brand.primary};color:${brand.white};text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">${ctaLabel}</a></p>
                  <p style="margin:0 0 18px 0;color:${brand.textMuted};font-size:13px;word-break:break-all;">${ctaUrl}</p>`
                : ""
            }
            <p style="margin:0;color:${brand.text};font-size:14px;">${signature}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px;background:${brand.footerBg};border-top:1px solid ${brand.border};font-family:Arial,sans-serif;direction:${isAr ? "rtl" : "ltr"};text-align:${isAr ? "right" : "left"};">
            <p style="margin:0 0 10px 0;font-size:12px;line-height:1.6;color:${brand.textMuted};">${securityNote}</p>
            <p style="margin:0 0 10px 0;font-size:12px;line-height:1.6;color:${brand.textMuted};">${automatedNotice}</p>
            <p style="margin:0;font-size:12px;line-height:1.7;color:${brand.text};">
              ${supportLabel}: <a href="mailto:${resolvedSupportEmail}" style="color:${brand.primary};text-decoration:none;">${resolvedSupportEmail}</a><br />
              ${phoneLabel}: ${resolvedSupportPhone}<br />
              ${websiteLabel}: <a href="${websiteUrl}" style="color:${brand.primary};text-decoration:none;">${websiteUrl}</a>
            </p>
            <p style="margin:10px 0 0 0;font-size:11px;line-height:1.6;color:${brand.textMuted};">${legalLine}</p>
          </td>
        </tr>
      </table>
    </div>
  `;
  return {
    html,
    subject,
    text: `${title}\n\n${intro}${ctaUrl ? `\n\n${ctaUrl}` : ""}\n\n${signature}`,
  };
}

export function registrationConfirmationTemplate({
  eventTitle,
  locale,
  registrantName,
}: {
  eventTitle: string;
  locale: Locale;
  registrantName: string;
}) {
  return withShell({
    intro:
      locale === "ar"
        ? `مرحباً ${registrantName}، تم استلام طلب تسجيلك في فعالية "${eventTitle}". سيتواصل معك فريق كيان خلال وقت قصير لتأكيد الخطوات التالية.`
        : `Hello ${registrantName}, we received your registration request for "${eventTitle}". The Kayan team will follow up shortly with next steps.`,
    locale,
    signature: locale === "ar" ? "مع التحية، فريق كيان" : "Best regards,\nKayan Team",
    subject: locale === "ar" ? `تأكيد استلام التسجيل: ${eventTitle}` : `Registration received: ${eventTitle}`,
    title: locale === "ar" ? "تم استلام تسجيلك" : "Registration Received",
  });
}

export function emailVerificationTemplate({
  locale,
  name,
  url,
}: {
  locale: Locale;
  name?: string | null;
  url: string;
}) {
  return withShell({
    ctaLabel: locale === "ar" ? "تأكيد البريد الإلكتروني" : "Verify Email",
    ctaUrl: url,
    intro:
      locale === "ar"
        ? `مرحباً ${name ?? ""}، لتفعيل حسابك في كيان، يرجى تأكيد بريدك الإلكتروني عبر الزر أدناه.`
        : `Hi ${name ?? ""}, please verify your email address to activate your Kayan account.`,
    locale,
    signature: locale === "ar" ? "فريق كيان" : "Kayan Team",
    subject: locale === "ar" ? "تأكيد بريدك الإلكتروني في كيان" : "Verify your email on Kayan",
    title: locale === "ar" ? "تأكيد البريد الإلكتروني" : "Email Verification",
  });
}

export function resetPasswordTemplate({
  locale,
  name,
  url,
}: {
  locale: Locale;
  name?: string | null;
  url: string;
}) {
  return withShell({
    ctaLabel: locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password",
    ctaUrl: url,
    intro:
      locale === "ar"
        ? `مرحباً ${name ?? ""}، تلقّينا طلباً لإعادة تعيين كلمة المرور. إذا كان الطلب منك، استخدم الرابط أدناه.`
        : `Hi ${name ?? ""}, we received a request to reset your password. If this was you, use the link below.`,
    locale,
    signature:
      locale === "ar"
        ? "إذا لم تطلب ذلك، يمكنك تجاهل الرسالة.\nفريق كيان"
        : "If you didn't request this, you can ignore this email.\nKayan Team",
    subject: locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset your password",
    title: locale === "ar" ? "طلب إعادة تعيين كلمة المرور" : "Password Reset Request",
  });
}

export function adminInviteTemplate({
  inviterName,
  locale,
  url,
}: {
  inviterName?: string | null;
  locale: Locale;
  url: string;
}) {
  return withShell({
    ctaLabel: locale === "ar" ? "الدخول إلى لوحة التحكم" : "Open Admin Dashboard",
    ctaUrl: url,
    intro:
      locale === "ar"
        ? `${inviterName ?? "أحد مسؤولي كيان"} منحك صلاحية المسؤول في منصة كيان. ادخل عبر الرابط أدناه لإدارة المحتوى والتسجيلات.`
        : `${inviterName ?? "A Kayan administrator"} granted you admin access to the Kayan platform. Use the link below to access the dashboard.`,
    locale,
    signature: locale === "ar" ? "فريق كيان" : "Kayan Team",
    subject: locale === "ar" ? "دعوة صلاحية مسؤول في كيان" : "Kayan admin access invitation",
    title: locale === "ar" ? "تمت دعوتك كمسؤول" : "You've Been Invited as Admin",
  });
}

export function accountSetupTemplate({
  locale,
  registrantName,
  url,
}: {
  locale: Locale;
  registrantName: string;
  url: string;
}) {
  return withShell({
    ctaLabel: locale === "ar" ? "ضبط كلمة المرور" : "Set Password",
    ctaUrl: url,
    intro:
      locale === "ar"
        ? `مرحباً ${registrantName}، أنشأنا لك حساباً في كيان أثناء التسجيل في فعالية. يرجى تعيين كلمة المرور للمتابعة.`
        : `Hello ${registrantName}, we created a Kayan account for you while registering for an event. Please set your password to continue.`,
    locale,
    signature: locale === "ar" ? "فريق كيان" : "Kayan Team",
    subject: locale === "ar" ? "تم إنشاء حسابك في كيان" : "Your Kayan account is ready",
    title: locale === "ar" ? "إعداد حسابك" : "Set Up Your Account",
  });
}

export function bankTransferPendingTemplate({
  eventTitle,
  locale,
  registrantName,
}: {
  eventTitle: string;
  locale: Locale;
  registrantName: string;
}) {
  return withShell({
    intro:
      locale === "ar"
        ? `مرحباً ${registrantName}، تسجيلك في "${eventTitle}" قيد انتظار التحقق من التحويل البنكي. سنؤكد الحالة فور مراجعة الدفع.`
        : `Hello ${registrantName}, your registration for "${eventTitle}" is waiting for bank transfer verification. We'll confirm once payment is reviewed.`,
    locale,
    signature: locale === "ar" ? "فريق كيان" : "Kayan Team",
    subject: locale === "ar" ? "بانتظار التحقق من التحويل البنكي" : "Bank transfer verification pending",
    title: locale === "ar" ? "حالة الدفع: قيد المراجعة" : "Payment Status: Pending Verification",
  });
}

export function paymentVerifiedTemplate({
  eventTitle,
  locale,
  registrantName,
}: {
  eventTitle: string;
  locale: Locale;
  registrantName: string;
}) {
  return withShell({
    intro:
      locale === "ar"
        ? `مرحباً ${registrantName}، تم التحقق من دفعتك وتأكيد تسجيلك في "${eventTitle}". نتطلع لمشاركتك معنا.`
        : `Hello ${registrantName}, your payment has been verified and your registration for "${eventTitle}" is confirmed.`,
    locale,
    signature: locale === "ar" ? "مع التحية، فريق كيان" : "Best regards,\nKayan Team",
    subject: locale === "ar" ? "تم تأكيد الدفعة والتسجيل" : "Payment verified and registration confirmed",
    title: locale === "ar" ? "تم تأكيد تسجيلك" : "Registration Confirmed",
  });
}

export function registrationStatusUpdateTemplate({
  eventTitle,
  locale,
  registrantName,
  registrationStatus,
  paymentStatus,
}: {
  eventTitle: string;
  locale: Locale;
  registrantName: string;
  registrationStatus: string;
  paymentStatus: string;
}) {
  return withShell({
    intro:
      locale === "ar"
        ? `مرحباً ${registrantName}، تم تحديث حالة تسجيلك في "${eventTitle}". الحالة الحالية: ${registrationStatus}. حالة الدفع: ${paymentStatus}.`
        : `Hello ${registrantName}, your registration for "${eventTitle}" was updated. Current registration status: ${registrationStatus}. Payment status: ${paymentStatus}.`,
    locale,
    signature: locale === "ar" ? "فريق كيان" : "Kayan Team",
    subject: locale === "ar" ? "تحديث حالة التسجيل" : "Registration status updated",
    title: locale === "ar" ? "تحديث التسجيل" : "Registration Update",
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function contactInquiryAdminTemplate({
  company,
  email,
  locale,
  message,
  name,
  phone,
  supportEmail,
  supportPhone,
}: {
  company: string;
  email: string;
  locale: Locale;
  message: string;
  name: string;
  phone: string;
  supportEmail?: string;
  supportPhone?: string;
}) {
  const isAr = locale === "ar";
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone || (isAr ? "غير متوفر" : "Not provided"));
  const safeCompany = escapeHtml(company || (isAr ? "غير متوفر" : "Not provided"));
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");

  const intro = isAr
    ? "تم إرسال استفسار جديد من صفحة تواصل معنا."
    : "A new inquiry was submitted through the Contact Us page.";
  const title = isAr ? "استفسار جديد من الموقع" : "New Website Contact Inquiry";

  return withShell({
    intro: `${intro}
    <br /><br />
    <strong>${isAr ? "الاسم" : "Name"}:</strong> ${safeName}<br />
    <strong>${isAr ? "البريد الإلكتروني" : "Email"}:</strong> ${safeEmail}<br />
    <strong>${isAr ? "الهاتف" : "Phone"}:</strong> ${safePhone}<br />
    <strong>${isAr ? "الشركة" : "Company"}:</strong> ${safeCompany}<br /><br />
    <strong>${isAr ? "الاستفسار" : "Message"}:</strong><br />${safeMessage}`,
    locale,
    supportEmail,
    supportPhone,
    signature: isAr ? "نظام كيان" : "Kayan Platform",
    subject: isAr ? "استفسار جديد من صفحة التواصل" : "New Contact Us inquiry",
    title,
  });
}
