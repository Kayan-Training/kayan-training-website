/**
 * Shared SEO helpers for locale-aware metadata.
 */
import type { Metadata } from "next";

import { SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/config";

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function buildLocaleAlternates(path: string): Metadata["alternates"] {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, `/${locale}${normalized}`]),
  ) as Record<AppLocale, string>;

  return {
    canonical: normalized,
    languages: {
      ...languages,
      "x-default": `/ar${normalized}`,
    },
  };
}

export function buildMetadataWithLocaleAlternates(input: {
  locale: AppLocale;
  path: string;
  title: Metadata["title"];
  description: string;
}): Metadata {
  const { locale, path, title, description } = input;
  const normalized = path.startsWith("/") ? path : `/${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${getBaseUrl()}/${locale}${normalized}`,
      languages: {
        ...Object.fromEntries(
        SUPPORTED_LOCALES.map((item) => [item, `${getBaseUrl()}/${item}${normalized}`]),
        ),
        "x-default": `${getBaseUrl()}/ar${normalized}`,
      },
    },
  };
}

export function buildAbsoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${normalized}`;
}

export function jsonLdScript(jsonLd: Record<string, unknown>): string {
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}
