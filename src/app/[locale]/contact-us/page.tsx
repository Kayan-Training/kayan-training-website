import { Building01Icon, Mail01Icon, WhatsappIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import { ContactForm } from "@/components/pages/contact-form";
import { AnimatedCategoryIcons } from "@/components/shared/animated-category-icons";
import { getAnimatedCategoryIcons } from "@/lib/content/category-icons";
import { isSupportedLocale } from "@/lib/i18n/config";
import { getLocalizedSiteSettings } from "@/lib/settings";
import { SOCIAL_PLATFORM_OPTIONS, type SocialPlatformKey } from "@/lib/social-platforms";
import { PhoneText } from "@/components/ui/phone-text";

function getMapEmbedSrc(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const isGoogleMaps = host.includes("google.") && parsed.pathname.includes("/maps");
    if (!isGoogleMaps) return "";
    if (parsed.pathname.includes("/maps/embed")) return parsed.toString();
    const q = parsed.searchParams.get("q") || parsed.searchParams.get("query");
    if (q) {
      return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
    }
    return `${parsed.origin}${parsed.pathname}${parsed.search ? `${parsed.search}&output=embed` : "?output=embed"}`;
  } catch {
    return "";
  }
}

export default async function ContactUsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const [siteSettings, categoryIcons] = await Promise.all([
    getLocalizedSiteSettings(activeLocale),
    getAnimatedCategoryIcons(activeLocale),
  ]);

  const socialMap = new Map(
    SOCIAL_PLATFORM_OPTIONS.map((platform) => [platform.value, platform]),
  );
  const socialLinks = (siteSettings.socialLinks ?? [])
    .filter((item) => item.url && socialMap.has(item.platform as SocialPlatformKey))
    .map((item) => ({
      icon: socialMap.get(item.platform as SocialPlatformKey)!.icon,
      label: socialMap.get(item.platform as SocialPlatformKey)!.label,
      url: item.url,
    }));

  const mapSrc = getMapEmbedSrc(siteSettings.contactPage.mapEmbedUrl);

  return (
    <main className="bg-surface pt-16">
      <section className="relative overflow-hidden border-b border-outline-variant/20 py-16 md:py-24">
        <div className="absolute inset-0">
          <Image
            alt=""
            className="object-cover object-center grayscale"
            fill
            priority
            sizes="100vw"
            src={siteSettings.contactPage.heroImageUrl}
          />
          <div className="absolute inset-0 bg-[linear-gradient(104deg,rgba(9,15,14,0.96)_8%,rgba(11,21,19,0.92)_42%,rgba(16,29,28,0.88)_68%,rgba(15,21,21,0.94)_100%)]" />
          <div className="hero-bg absolute inset-0 z-0 pointer-events-none" />
        </div>
        <div className="relative mx-auto grid w-full max-w-[1440px] gap-10 px-6 md:px-10 lg:grid-cols-[1fr_1fr] lg:items-stretch">
          <div>
            <span className="mb-3 block text-xs font-semibold uppercase tracking-widest text-secondary">
              {siteSettings.contactPage.eyebrow}
            </span>
            <h1 className="hero-heading text-balance font-semibold leading-[1.12] tracking-tight text-on-surface">
              {siteSettings.contactPage.title}
            </h1>
            <p className="hero-subheading mt-4 max-w-2xl leading-relaxed text-on-surface-variant">
              {siteSettings.contactPage.subtitle}
            </p>
          </div>
          <div className="ghost-border glass-panel flex flex-col justify-between p-7 md:p-9">
            <div className="mb-8 flex items-start gap-5">
              <div className="flex">
                <Image
                  alt="Kayan"
                  className="h-auto max-h-14 w-auto"
                  height={56}
                  src={siteSettings.contactPage.logoUrl}
                  width={300}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-semibold leading-tight text-on-surface">{siteSettings.siteName}</p>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{siteSettings.siteTagline}</p>
              </div>
            </div>
            <p className="text-base leading-relaxed text-on-surface-variant">{siteSettings.contactAddress}</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-on-surface-variant">
              <a className="inline-flex items-center gap-2 hover:text-primary" href={`mailto:${siteSettings.contactEmail}`}>
                <HugeiconsIcon icon={Mail01Icon} size={17} strokeWidth={1.8} />
                {siteSettings.contactEmail}
              </a>
              <a
                className="inline-flex items-center gap-2 hover:text-primary"
                href={`https://api.whatsapp.com/send?phone=${siteSettings.contactPhone.replace(/[^\d]/g, "")}`}
                rel="noreferrer"
                target="_blank"
              >
                <HugeiconsIcon icon={WhatsappIcon} size={17} strokeWidth={1.8} />
                <PhoneText>{siteSettings.contactPhone}</PhoneText>
              </a>
            </div>
            {socialLinks.length > 0 ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {socialLinks.map((item) => (
                  <Link
                    aria-label={item.label}
                    className="inline-flex h-9 w-9 items-center justify-center border border-outline-variant/45 text-on-surface-variant transition-colors hover:border-secondary/50 hover:text-secondary"
                    href={item.url}
                    key={item.label}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <HugeiconsIcon icon={item.icon} size={16} strokeWidth={1.8} />
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="mt-8 border-t border-outline-variant/20 pt-5">
              <AnimatedCategoryIcons
                className="!grid !w-fit !grid-cols-4 sm:!grid-cols-8 !gap-0"
                iconSize={48}
                icons={categoryIcons}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1440px] gap-8 px-6 py-14 md:px-10 md:py-20 lg:grid-cols-12">
        <div className={`border border-outline-variant/30 bg-surface-container-low p-6 md:p-8 ${mapSrc ? "lg:col-span-7" : "lg:col-span-8"}`}>
          <h2 className="mb-5 text-[clamp(1.8rem,2.4vw,2.5rem)] font-semibold text-on-surface">
            {siteSettings.contactPage.form.heading}
          </h2>
          <ContactForm content={siteSettings.contactPage.form} locale={activeLocale} />
        </div>
        {mapSrc ? (
          <div className="overflow-hidden border border-outline-variant/30 bg-surface-container-low lg:col-span-5">
            <iframe
              allowFullScreen
              className="h-[380px] w-full lg:h-full lg:min-h-[520px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={mapSrc}
              title={activeLocale === "ar" ? "موقع الشركة على الخريطة" : "Company Location Map"}
            />
          </div>
        ) : (
          <div className="ghost-border relative overflow-hidden bg-surface-container-high lg:col-span-4">
            <div className="absolute inset-0">
              <Image
                alt=""
                className="object-cover object-center grayscale"
                fill
                sizes="(max-width: 1024px) 100vw, 35vw"
                src={siteSettings.contactPage.noMapImageUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/95 via-surface-container-lowest/72 to-surface-container-lowest/28" />
            </div>
            <div className="relative flex h-full min-h-[520px] flex-col justify-end p-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center border border-secondary/45 bg-secondary/12 text-secondary">
                <HugeiconsIcon icon={Building01Icon} size={24} strokeWidth={1.8} />
              </div>
              <h3 className="text-2xl font-semibold leading-tight text-on-surface">
                {siteSettings.contactPage.noMapTitle}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                {siteSettings.contactPage.noMapDescription}
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
