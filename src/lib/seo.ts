/**
 * Shared SEO helpers for locale-aware metadata.
 */
import type { Metadata } from "next";

import { SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/config";

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function buildMetadataWithLocaleAlternates(input: {
  locale: AppLocale;
  path: string;
  title: Metadata["title"];
  description: string;
}): Metadata {
  const { locale, path, title, description } = input;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${getBaseUrl()}/${locale}${normalized}`;
  const plainTitle = typeof title === "string" ? title : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(
          SUPPORTED_LOCALES.map((item) => [item, `${getBaseUrl()}/${item}${normalized}`]),
        ),
        "x-default": `${getBaseUrl()}/ar${normalized}`,
      },
    },
    // No `images` here: the opengraph-image.tsx/twitter-image.tsx file-convention
    // routes generate the real branded share image and Next auto-attaches it —
    // setting images explicitly here would override that with the raw source photo.
    openGraph: {
      title: plainTitle,
      description,
      type: "website",
      locale,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: plainTitle,
      description,
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
