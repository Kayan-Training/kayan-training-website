"use client";

import { usePathname, useRouter } from "next/navigation";

import { LOCALE_COOKIE_KEY, type AppLocale } from "@/lib/i18n/config";

export function LocaleSwitcher({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(nextLocale: AppLocale) {
    if (!pathname) return;
    const segments = pathname.split("/");
    if (segments.length > 1) {
      segments[1] = nextLocale;
    }
    document.cookie = `${LOCALE_COOKIE_KEY}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.replace(segments.join("/"));
    router.refresh();
  }

  const nextLocale: AppLocale = locale === "en" ? "ar" : "en";
  const nextLabel = locale === "en" ? "AR" : "EN";

  return (
    <button
      className="lang-toggle-btn ghost-border inline-flex h-9 w-9 items-center justify-center text-[12px] font-semibold text-on-surface-variant transition-colors hover:text-primary"
      onClick={() => switchLocale(nextLocale)}
      type="button"
    >
      <span>{nextLabel}</span>
    </button>
  );
}
