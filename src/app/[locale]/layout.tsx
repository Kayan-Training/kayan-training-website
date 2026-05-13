import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LocaleShell } from "@/components/layout/locale-shell";
import { FeaturedProgramsPopup } from "@/components/layout/featured-programs-popup";
import type { NavMenuItem } from "@/components/layout/nav";
import { getAnimatedCategoryIcons } from "@/lib/content/category-icons";
import { getFeaturedPrograms } from "@/lib/content/queries";
import { db } from "@/lib/db";
import { LOCALE_DIRECTION, isSupportedLocale, type AppLocale } from "@/lib/i18n/config";
import { getLocalizedSiteSettings } from "@/lib/settings";
import { buildMetadataWithLocaleAlternates } from "@/lib/seo";

function localizeMenuHref(href: string, locale: AppLocale): string {
  if (!href.startsWith("/")) return href;
  if (href.startsWith("//")) return href;
  const normalized = href.replace(/^\/(ar|en)(?=\/|$)/, "");
  return `/${locale}${normalized || ""}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale: AppLocale = isSupportedLocale(locale) ? locale : "ar";
  const site = await getLocalizedSiteSettings(activeLocale);

  return {
    ...buildMetadataWithLocaleAlternates({
      description: site.siteDescription,
      locale: activeLocale,
      path: "",
      title: {
        default: site.siteName,
        template: `%s — ${site.siteName}`,
      },
    }),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  const siteSettings = await getLocalizedSiteSettings(locale);
  const footerCategoryIcons = siteSettings.footerShowAnimatedCategoryIcons
    ? await getAnimatedCategoryIcons(locale)
    : [];
  const featuredPrograms = await getFeaturedPrograms(locale, 8);

  const menus = await db.menu.findMany({
    where: { location: { in: ["main", "header"] } },
    include: {
      items: {
        include: { translations: true },
        orderBy: { order: "asc" },
      },
    },
  });
  const mainMenu = menus.find((m) => m.location === "main") ?? menus.find((m) => m.location === "header") ?? null;

  const targetIds = (mainMenu?.items ?? [])
    .filter((item) => item.type !== "link" && item.targetId)
    .map((item) => item.targetId as string);

  const [pages, posts, events] = await Promise.all([
    targetIds.length
      ? db.page.findMany({ where: { id: { in: targetIds } }, select: { id: true, slug: true } })
      : Promise.resolve([]),
    targetIds.length
      ? db.post.findMany({ where: { id: { in: targetIds } }, select: { id: true, slug: true } })
      : Promise.resolve([]),
    targetIds.length
      ? db.event.findMany({ where: { id: { in: targetIds } }, select: { id: true, slug: true, eventKind: true } })
      : Promise.resolve([]),
  ]);

  const pageById = new Map(pages.map((p) => [p.id, p]));
  const postById = new Map(posts.map((p) => [p.id, p]));
  const eventById = new Map(events.map((e) => [e.id, e]));

  const menuItems: NavMenuItem[] | undefined = (mainMenu?.items ?? [])
    .map((item) => {
      let href = item.url ?? "";
      if (!href && item.targetId) {
        if (item.type === "page") {
          const page = pageById.get(item.targetId);
          href = page ? `/${locale}/${page.slug}` : "";
        } else if (item.type === "post") {
          const post = postById.get(item.targetId);
          href = post ? `/${locale}/blog/${post.slug}` : "";
        } else if (item.type === "event") {
          const event = eventById.get(item.targetId);
          const eventKind = (event as { eventKind?: string } | undefined)?.eventKind;
          href = event
            ? eventKind === "training_course"
              ? `/${locale}/training-courses/${event.slug}`
              : `/${locale}/events/${event.slug}`
            : "";
        }
      }
      if (!href) return null;
      const localizedHref = localizeMenuHref(href, locale);
      return {
        href: localizedHref,
        labelEn: item.translations.find((t) => t.locale === "en")?.label ?? "",
        labelAr: item.translations.find((t) => t.locale === "ar")?.label ?? "",
      };
    })
    .filter((item): item is NavMenuItem => Boolean(item));

  return (
    <div data-locale={locale} dir={LOCALE_DIRECTION[locale]}>
      <LocaleShell
        locale={locale}
        menuItems={menuItems}
        siteSettings={siteSettings}
        footerCategoryIcons={footerCategoryIcons}
      >
        {children}
        <FeaturedProgramsPopup
          events={featuredPrograms.map((program) => ({
            basePath: program.basePath,
            coverImage: program.coverImage,
            dateIso: program.startDate,
            excerpt: "",
            location: program.location,
            logo: program.logo,
            capacity: program.capacity,
            registrationsCount: program.registrationsCount,
            registrationsOpen: program.registrationsOpen,
            slug: program.slug,
            title: program.title,
            updatedAtIso: program.updatedAt,
          }))}
          locale={locale}
        />
      </LocaleShell>
    </div>
  );
}
