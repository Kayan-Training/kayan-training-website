import { notFound } from "next/navigation";

import { LocaleShell } from "@/components/layout/locale-shell";
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

  return (
    <div data-locale={locale} dir={LOCALE_DIRECTION[locale]}>
      <LocaleShell locale={locale}>{children}</LocaleShell>
    </div>
  );
}

