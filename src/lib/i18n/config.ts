/**
 * Central locale configuration for routing and dictionary loading.
 */
export const SUPPORTED_LOCALES = ["ar", "en"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "ar";

export const LOCALE_COOKIE_KEY = "preferred_locale";

export const LOCALE_DIRECTION: Record<AppLocale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export function isSupportedLocale(value: string): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale);
}
