import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockRenderer } from "@/components/pages/block-renderer";
import { db } from "@/lib/db";
import { getStaticPageBySlug } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";
import type { Block } from "@/lib/pages/block-types";
import { migrateBlocks } from "@/lib/pages/migrate-blocks";
import { buildMetadataWithLocaleAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}): Promise<Metadata> {
  const { locale, page } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const data = await getStaticPageBySlug(activeLocale, page);
  if (!data) return {};
  return buildMetadataWithLocaleAlternates({
    description: data.seoDescription || data.title,
    locale: activeLocale,
    path: `/${page}`,
    title: data.seoTitle || data.title,
  });
}

function parseBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) return [];
  const filtered = raw.filter((b) => b && typeof b === "object" && "type" in b);
  return migrateBlocks(filtered);
}

export default async function DynamicCmsPage({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale, page } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const data = await getStaticPageBySlug(activeLocale, page);

  if (!data) notFound();

  const blocks = parseBlocks(data.blocks);

  const needsCategories = blocks.some((b) => b.type === "training_domains");
  let categories: { slug: string; color: string; icon: string; image: string | null; nameEn: string; nameAr: string }[] = [];

  if (needsCategories) {
    const cats = await db.category.findMany({
      include: { translations: true },
      orderBy: { slug: "asc" },
    });
    categories = cats.map((cat) => ({
      slug: cat.slug,
      color: cat.color,
      icon: cat.icon,
      image: cat.image,
      nameEn: cat.translations.find((t) => t.locale === "en")?.name ?? cat.slug,
      nameAr: cat.translations.find((t) => t.locale === "ar")?.name ?? cat.slug,
    }));
  }

  if (blocks.length > 0) {
    return (
      <main>
        <BlockRenderer blocks={blocks} categories={categories} locale={activeLocale} />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-275 px-6 py-14 md:px-10 md:py-18">
      <h1 className="mb-6 text-4xl font-semibold tracking-tight md:text-5xl">{data.title}</h1>
      <article className="rounded-lg border border-border/70 bg-card p-6 text-sm text-on-surface-variant">
        {activeLocale === "ar" ? "لا يوجد محتوى لهذه الصفحة حالياً." : "This page has no content yet."}
      </article>
    </main>
  );
}
