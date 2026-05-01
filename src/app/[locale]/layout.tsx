import { notFound } from "next/navigation";

import { LocaleShell } from "@/components/layout/locale-shell";
import type { NavMenuItem } from "@/components/layout/nav";
import { db } from "@/lib/db";
import { LOCALE_DIRECTION, isSupportedLocale } from "@/lib/i18n/config";

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

  const mainMenu = await db.menu
    .findUnique({
      where: { location: "main" },
      include: {
        items: {
          include: { translations: true },
          orderBy: { order: "asc" },
        },
      },
    })
    .catch(() => null);

  const menuItems: NavMenuItem[] | undefined = mainMenu?.items.map((item) => ({
    href: item.url ?? `/${locale}`,
    labelEn: item.translations.find((t) => t.locale === "en")?.label ?? "",
    labelAr: item.translations.find((t) => t.locale === "ar")?.label ?? "",
  }));

  return (
    <div data-locale={locale} dir={LOCALE_DIRECTION[locale]}>
      <LocaleShell locale={locale} menuItems={menuItems}>{children}</LocaleShell>
    </div>
  );
}

