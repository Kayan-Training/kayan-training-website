import { type AppLocale, isSupportedLocale } from "@/lib/i18n/config";

type Dictionary = Record<string, string>;

const dictionaries: Record<AppLocale, () => Promise<Dictionary>> = {
  ar: async () => (await import("@/messages/ar.json")).default as Dictionary,
  en: async () => (await import("@/messages/en.json")).default as Dictionary,
};

export async function getDictionary(locale: string) {
  const safeLocale: AppLocale = isSupportedLocale(locale) ? locale : "ar";
  return dictionaries[safeLocale]();
}

