import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { AnimatedCategoryIcons } from "@/components/shared/animated-category-icons";
import type { AnimatedCategoryIconItem } from "@/lib/content/category-icons";
import { SOCIAL_PLATFORM_OPTIONS, type SocialPlatformKey } from "@/lib/social-platforms";
import { PhoneText } from "@/components/ui/phone-text";

export function SiteFooter({
  locale,
  settings,
  footerCategoryIcons,
}: {
  locale: "ar" | "en";
  footerCategoryIcons?: AnimatedCategoryIconItem[];
  settings?: {
    contactAddress: string;
    contactEmail: string;
    contactPhone: string;
    siteName: string;
    siteTagline: string;
    socialInstagram: string;
    socialLinkedIn: string;
    socialLinks?: { platform: string; url: string }[];
    socialX: string;
    socialYouTube: string;
    footerShowAnimatedCategoryIcons?: boolean;
  };
}) {
  const siteTagline =
    settings?.siteTagline ||
    (locale === "ar"
      ? "الشريك الاستراتيجي للتطوير المؤسسي في سلطنة عُمان. تدريب دقيق لعالم متغير."
      : "The strategic partner for institutional development in the Sultanate of Oman. Precise training for a changing world.");
  const contactEmail = settings?.contactEmail || "training@kayan.om";
  const contactPhone = settings?.contactPhone || "+968 9538 3138";
  const whatsappPhone = contactPhone.replace(/[^\d]/g, "");
  const contactAddress = settings?.contactAddress || (locale === "ar" ? "سلطنة عُمان، مسقط" : "Sultanate of Oman, Muscat");
  const siteName = settings?.siteName || (locale === "ar" ? "كيان للتدريب والاستشارات" : "Kayan Training & Consulting");
  const mappedPlatforms = new Map(
    SOCIAL_PLATFORM_OPTIONS.map((item) => [item.value, { icon: item.icon, label: item.label }]),
  );
  const socialLinks: { href: string; icon: (typeof SOCIAL_PLATFORM_OPTIONS)[number]["icon"]; label: string }[] = [];
  if (settings?.socialLinks && settings.socialLinks.length > 0) {
    for (const item of settings.socialLinks) {
      const platform = mappedPlatforms.get(item.platform as SocialPlatformKey);
      if (!platform || !item.url) continue;
      socialLinks.push({ href: item.url, icon: platform.icon, label: platform.label });
    }
  } else {
    if (settings?.socialLinkedIn) {
      socialLinks.push({ href: settings.socialLinkedIn, icon: mappedPlatforms.get("linkedin")!.icon, label: "LinkedIn" });
    }
    if (settings?.socialX) {
      socialLinks.push({ href: settings.socialX, icon: mappedPlatforms.get("x")!.icon, label: "X / Twitter" });
    }
    if (settings?.socialInstagram) {
      socialLinks.push({ href: settings.socialInstagram, icon: mappedPlatforms.get("instagram")!.icon, label: "Instagram" });
    }
    if (settings?.socialYouTube) {
      socialLinks.push({ href: settings.socialYouTube, icon: mappedPlatforms.get("youtube")!.icon, label: "YouTube" });
    }
  }

  return (
    <footer className="border-t border-white/[0.05] bg-surface-container-lowest">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-12 px-6 py-16 md:grid-cols-2 md:px-10 lg:grid-cols-4 lg:py-24 [&>*]:min-w-0">
        <div className="min-w-0 lg:col-span-2">
          <Link className="mb-5 inline-block" href={`/${locale}`}>
            <Image alt="Kayan" className="h-12 w-auto" height={48} src="/brand/kayan-logo.svg" width={200} />
          </Link>
          <p className="mb-6 max-w-xs text-sm leading-relaxed text-on-surface-variant">
            {siteTagline}
          </p>
          {settings?.footerShowAnimatedCategoryIcons && (footerCategoryIcons?.length ?? 0) > 0 ? (
            <AnimatedCategoryIcons
              className={
                locale === "ar"
                  ? "mb-6 ml-auto !flex max-w-xs !w-fit !flex-wrap !gap-0"
                  : "mb-6 !flex max-w-xs !w-fit !flex-wrap !gap-0"
              }
              iconSize={36}
              icons={footerCategoryIcons ?? []}
            />
          ) : null}
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <a className="min-w-0 break-all font-mono text-xs text-primary hover:text-secondary" href={`mailto:${contactEmail}`}>{contactEmail}</a>
            <span className="hidden text-outline sm:block">·</span>
            <a
              className="min-w-0 break-all font-mono text-xs text-on-surface-variant hover:text-on-surface"
              href={`https://api.whatsapp.com/send?phone=${whatsappPhone}`}
              rel="noreferrer"
              target="_blank"
            >
              <PhoneText>{contactPhone}</PhoneText>
            </a>
            {socialLinks.length > 0 ? <span className="hidden text-outline sm:block">·</span> : null}
            {socialLinks.length > 0 ? (
              <div className="flex items-center gap-2">
                {socialLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      aria-label={item.label}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-outline-variant/40 text-on-surface-variant transition-colors hover:border-secondary/50 hover:text-secondary"
                      href={item.href}
                      key={item.label}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <HugeiconsIcon icon={Icon} size={14} strokeWidth={1.8} />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
        <div className="min-w-0">
          <h5 className="footer-micro-title mb-5 text-[10px] font-bold uppercase tracking-widest text-on-surface">
            {locale === "ar" ? "روابط" : "Links"}
          </h5>
          <div className="space-y-3">
            <Link className="block text-sm text-on-surface-variant hover:text-primary" href={`/${locale}/events`}>{locale === "ar" ? "الفعاليات" : "Events"}</Link>
            <Link className="block text-sm text-on-surface-variant hover:text-primary" href={`/${locale}/services`}>{locale === "ar" ? "خدماتنا" : "Services"}</Link>
            <Link className="block text-sm text-on-surface-variant hover:text-primary" href={`/${locale}/about`}>{locale === "ar" ? "عن كيان" : "About"}</Link>
            <Link className="block text-sm text-on-surface-variant hover:text-primary" href={`/${locale}/contact-us`}>{locale === "ar" ? "تواصل معنا" : "Contact Us"}</Link>
            <Link className="block text-sm text-on-surface-variant hover:text-primary" href={`/${locale}/auth`}>{locale === "ar" ? "تسجيل الدخول" : "Login"}</Link>
          </div>
        </div>
        <div className="min-w-0">
          <h5 className="footer-micro-title mb-5 text-[10px] font-bold uppercase tracking-widest text-on-surface">
            {locale === "ar" ? "العنوان" : "Address"}
          </h5>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            {contactAddress}
          </p>
          <div className="mt-6">
            <LocaleSwitcher locale={locale} />
          </div>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-3 border-t border-white/[0.05] px-6 py-6 sm:flex-row md:px-10">
        <p className="footer-micro-copy text-[11px] text-on-surface-variant">
          {locale === "ar"
            ? `© 2026 ${siteName}. جميع الحقوق محفوظة.`
            : `© 2026 ${siteName}. All rights reserved.`}
        </p>
        <div className="flex items-center gap-4">
          <Link className="footer-micro-link text-[10px] uppercase tracking-widest text-outline hover:text-on-surface-variant" href={`/${locale}/privacy`}>
            {locale === "ar" ? "الخصوصية" : "Privacy"}
          </Link>
          <span className="text-outline/40">·</span>
          <Link className="footer-micro-link text-[10px] uppercase tracking-widest text-outline hover:text-on-surface-variant" href={`/${locale}/terms`}>
            {locale === "ar" ? "الشروط" : "Terms"}
          </Link>
        </div>
      </div>
    </footer>
  );
}
