import { cache } from "react";

import { db } from "@/lib/db";
import type { AppLocale } from "@/lib/i18n/config";

type SettingMap = Map<string, string>;

const getSettingsMap = cache(async (): Promise<SettingMap> => {
  const settings = await db.setting.findMany({
    where: {
      key: {
        in: [
          "site.name",
          "site.name.ar",
          "site.name.en",
          "site.tagline",
          "site.tagline.ar",
          "site.tagline.en",
          "site.description",
          "site.description.ar",
          "site.description.en",
          "contact.email",
          "contact.phone",
          "contact.address",
          "contact.address.ar",
          "contact.address.en",
          "social.linkedin",
          "social.twitter",
          "social.instagram",
          "social.youtube",
          "social.links",
          "contact.page.eyebrow.ar",
          "contact.page.eyebrow.en",
          "contact.page.title.ar",
          "contact.page.title.en",
          "contact.page.subtitle.ar",
          "contact.page.subtitle.en",
          "contact.page.logoUrl",
          "contact.page.heroImageUrl",
          "contact.page.mapEmbedUrl",
          "contact.page.form.heading.ar",
          "contact.page.form.heading.en",
          "contact.page.form.nameLabel.ar",
          "contact.page.form.nameLabel.en",
          "contact.page.form.emailLabel.ar",
          "contact.page.form.emailLabel.en",
          "contact.page.form.phoneLabel.ar",
          "contact.page.form.phoneLabel.en",
          "contact.page.form.companyLabel.ar",
          "contact.page.form.companyLabel.en",
          "contact.page.form.queryLabel.ar",
          "contact.page.form.queryLabel.en",
          "contact.page.form.submitLabel.ar",
          "contact.page.form.submitLabel.en",
          "contact.page.form.submittingLabel.ar",
          "contact.page.form.submittingLabel.en",
          "contact.page.form.successTitle.ar",
          "contact.page.form.successTitle.en",
          "contact.page.form.successMessage.ar",
          "contact.page.form.successMessage.en",
          "contact.page.form.errorMessage.ar",
          "contact.page.form.errorMessage.en",
          "contact.page.noMapImageUrl",
          "contact.page.noMapTitle.ar",
          "contact.page.noMapTitle.en",
          "contact.page.noMapDescription.ar",
          "contact.page.noMapDescription.en",
          "frontend.theme.background",
          "frontend.theme.foreground",
          "frontend.theme.card",
          "frontend.theme.muted",
          "frontend.theme.mutedForeground",
          "frontend.theme.border",
          "frontend.theme.surface",
          "frontend.theme.surfaceDim",
          "frontend.theme.surfaceContainerLow",
          "frontend.theme.surfaceContainerLowest",
          "frontend.theme.accent",
          "frontend.theme.border",
          "header.cta.label.en",
          "header.cta.label.ar",
          "header.cta.url",
          "footer.showAnimatedCategoryIcons",
        ],
      },
    },
  });

  return new Map(
    settings.map((s) => [s.key, typeof s.value === "string" ? s.value : ""]),
  );
});

function fromMap(map: SettingMap, key: string): string {
  return map.get(key)?.trim() ?? "";
}

export async function getLocalizedSiteSettings(locale: AppLocale) {
  const map = await getSettingsMap();

  const siteName =
    fromMap(map, `site.name.${locale}`) ||
    fromMap(map, "site.name") ||
    (locale === "ar" ? "كيان للتدريب والاستشارات" : "Kayan Training & Consulting");

  const siteTagline =
    fromMap(map, `site.tagline.${locale}`) ||
    fromMap(map, "site.tagline") ||
    (locale === "ar"
      ? "الشريك الاستراتيجي للتطوير المؤسسي في سلطنة عُمان. تدريب دقيق لعالم متغير."
      : "The strategic partner for institutional development in the Sultanate of Oman. Precise training for a changing world.");

  const siteDescription =
    fromMap(map, `site.description.${locale}`) ||
    fromMap(map, "site.description") ||
    (locale === "ar"
      ? "منصة متعددة اللغات لإدارة الفعاليات والمحتوى المعرفي."
      : "A multilingual platform for events, consulting, and knowledge content.");

  const contactEmail = fromMap(map, "contact.email") || "training@kayan.om";
  const contactPhone = fromMap(map, "contact.phone") || "+968 9538 3138";
  const contactAddress =
    fromMap(map, `contact.address.${locale}`) ||
    fromMap(map, "contact.address") ||
    (locale === "ar" ? "سلطنة عُمان، مسقط" : "Sultanate of Oman, Muscat");
  const socialLinkedIn = fromMap(map, "social.linkedin");
  const socialX = fromMap(map, "social.twitter");
  const socialInstagram = fromMap(map, "social.instagram");
  const socialYouTube = fromMap(map, "social.youtube");
  const socialLinksRaw = fromMap(map, "social.links");
  const socialLinks = (() => {
    if (!socialLinksRaw) {
      return [
        socialLinkedIn ? { platform: "linkedin", url: socialLinkedIn } : null,
        socialX ? { platform: "x", url: socialX } : null,
        socialInstagram ? { platform: "instagram", url: socialInstagram } : null,
        socialYouTube ? { platform: "youtube", url: socialYouTube } : null,
      ].filter(Boolean) as { platform: string; url: string }[];
    }
    try {
      const parsed = JSON.parse(socialLinksRaw) as { platform?: string; url?: string }[];
      return parsed
        .filter((item) => item?.platform && item?.url)
        .map((item) => ({ platform: String(item.platform), url: String(item.url) }));
    } catch {
      return [];
    }
  })();
  const frontendTheme = {
    background: fromMap(map, "frontend.theme.background") || "#121414",
    foreground: fromMap(map, "frontend.theme.foreground") || "#e2e2e2",
    card: fromMap(map, "frontend.theme.card") || "#1a1c1c",
    muted: fromMap(map, "frontend.theme.muted") || "#1e2020",
    mutedForeground: fromMap(map, "frontend.theme.mutedForeground") || "#8b9295",
    border: fromMap(map, "frontend.theme.border") || "#41484a",
    surface: fromMap(map, "frontend.theme.surface") || "#121414",
    surfaceDim: fromMap(map, "frontend.theme.surfaceDim") || "#0d0f0f",
    surfaceContainerLow:
      fromMap(map, "frontend.theme.surfaceContainerLow") || "#1a1c1c",
    surfaceContainerLowest:
      fromMap(map, "frontend.theme.surfaceContainerLowest") || "#0d0f0f",
    accent: fromMap(map, "frontend.theme.accent") || "#1e2020",
  };
  const headerCta = {
    labelEn: fromMap(map, "header.cta.label.en") || "View Events",
    labelAr: fromMap(map, "header.cta.label.ar") || "الفعاليات",
    url: fromMap(map, "header.cta.url") || `/${locale}/events`,
  };
  const footerShowAnimatedCategoryIcons = fromMap(map, "footer.showAnimatedCategoryIcons") === "1";
  const contactPage = {
    eyebrow:
      fromMap(map, `contact.page.eyebrow.${locale}`) ||
      (locale === "ar" ? "تواصل معنا" : "Contact Us"),
    title:
      fromMap(map, `contact.page.title.${locale}`) ||
      (locale === "ar" ? "دعنا نناقش احتياجك التدريبي" : "Let's Discuss Your Training Needs"),
    subtitle:
      fromMap(map, `contact.page.subtitle.${locale}`) ||
      (locale === "ar"
        ? "أرسل استفسارك وسيعود إليك فريق كيان بأسرع وقت."
        : "Send your inquiry and the Kayan team will get back to you shortly."),
    logoUrl: fromMap(map, "contact.page.logoUrl") || "/brand/kayan-logo.svg",
    heroImageUrl:
      fromMap(map, "contact.page.heroImageUrl") ||
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1800&q=80",
    mapEmbedUrl: fromMap(map, "contact.page.mapEmbedUrl"),
    noMapImageUrl:
      fromMap(map, "contact.page.noMapImageUrl") ||
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&q=80",
    noMapTitle:
      fromMap(map, `contact.page.noMapTitle.${locale}`) ||
      (locale === "ar" ? "ندعمك من الفكرة إلى التنفيذ" : "From Inquiry to Implementation"),
    noMapDescription:
      fromMap(map, `contact.page.noMapDescription.${locale}`) ||
      (locale === "ar"
        ? "فريقنا يساعدك في بناء برامج تدريبية عملية مصممة لأهداف مؤسستك."
        : "Our team helps you design practical training programs aligned to your institution goals."),
    form: {
      heading:
        fromMap(map, `contact.page.form.heading.${locale}`) ||
        (locale === "ar" ? "أرسل استفسارك" : "Send Your Inquiry"),
      nameLabel:
        fromMap(map, `contact.page.form.nameLabel.${locale}`) ||
        (locale === "ar" ? "الاسم" : "Name"),
      emailLabel:
        fromMap(map, `contact.page.form.emailLabel.${locale}`) ||
        (locale === "ar" ? "البريد الإلكتروني" : "Email"),
      phoneLabel:
        fromMap(map, `contact.page.form.phoneLabel.${locale}`) ||
        (locale === "ar" ? "الهاتف" : "Phone"),
      companyLabel:
        fromMap(map, `contact.page.form.companyLabel.${locale}`) ||
        (locale === "ar" ? "الشركة" : "Company"),
      queryLabel:
        fromMap(map, `contact.page.form.queryLabel.${locale}`) ||
        (locale === "ar" ? "الاستفسار" : "How can we help you?"),
      submitLabel:
        fromMap(map, `contact.page.form.submitLabel.${locale}`) ||
        (locale === "ar" ? "إرسال الرسالة" : "Send Message"),
      submittingLabel:
        fromMap(map, `contact.page.form.submittingLabel.${locale}`) ||
        (locale === "ar" ? "جاري الإرسال..." : "Sending..."),
      successTitle:
        fromMap(map, `contact.page.form.successTitle.${locale}`) ||
        (locale === "ar" ? "تم إرسال رسالتك" : "Message Sent"),
      successMessage:
        fromMap(map, `contact.page.form.successMessage.${locale}`) ||
        (locale === "ar"
          ? "شكرًا {name}. استلمنا استفسارك وسيتواصل معك فريق كيان قريبًا عبر البريد أو الهاتف."
          : "Thank you {name}. We have received your inquiry and the Kayan team will contact you shortly by email or phone."),
      errorMessage:
        fromMap(map, `contact.page.form.errorMessage.${locale}`) ||
        (locale === "ar" ? "تعذر إرسال الرسالة، حاول مرة أخرى." : "Failed to send message. Please try again."),
    },
  };

  return {
    contactAddress,
    contactEmail,
    contactPhone,
    siteDescription,
    siteName,
    siteTagline,
    socialInstagram,
    socialLinkedIn,
    socialLinks,
    socialX,
    socialYouTube,
    frontendTheme,
    headerCta,
    footerShowAnimatedCategoryIcons,
    contactPage,
  };
}
