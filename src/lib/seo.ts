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
  image?: string | null;
}): Metadata {
  const { locale, path, title, description, image } = input;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${getBaseUrl()}/${locale}${normalized}`;
  const plainTitle = typeof title === "string" ? title : undefined;
  const absoluteImage = image
    ? /^https?:\/\//i.test(image)
      ? image
      : buildAbsoluteUrl(image)
    : undefined;

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
    openGraph: {
      title: plainTitle,
      description,
      type: "website",
      locale,
      url,
      images: absoluteImage ? [absoluteImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: plainTitle,
      description,
      images: absoluteImage ? [absoluteImage] : undefined,
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
