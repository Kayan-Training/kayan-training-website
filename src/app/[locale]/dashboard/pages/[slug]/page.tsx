import { notFound } from "next/navigation";

import type { LinkPickerEntities } from "@/components/ui/link-picker-input";
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { PageEditor, type PageData } from "../_components/page-editor";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const page = await db.page.findFirst({
    where: { slug },
    include: { translations: { where: { locale: "en" }, take: 1 } },
  });
  const title = page?.translations[0]?.title ?? slug;
  return { title: `${title} — Pages` };
}

function parseBlocks(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((b) => b && typeof b === "object" && "type" in b);
}

export default async function DashboardPageEditor({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const [page, pages, posts, events] = await Promise.all([
    db.page.findFirst({
      where: { slug },
      include: { translations: true },
    }),
    db.page.findMany({
      include: { translations: { where: { locale: activeLocale }, take: 1 } },
      orderBy: { slug: "asc" },
    }),
    db.post.findMany({
      where: { status: "published" },
      include: { translations: { where: { locale: activeLocale }, take: 1 } },
      orderBy: { publishedAt: "desc" },
    }),
    db.event.findMany({
      where: { status: "published" },
      include: { translations: { where: { locale: activeLocale }, take: 1 } },
      orderBy: { startDate: "desc" },
    }),
  ]);

  if (!page) notFound();

  const trEn = page.translations.find((t) => t.locale === "en");
  const trAr = page.translations.find((t) => t.locale === "ar");

  const pageData: PageData = {
    id: page.id,
    slug: page.slug,
    status: page.status,
    titleEn: trEn?.title ?? "",
    titleAr: trAr?.title ?? "",
    seoTitleEn: trEn?.seoTitle ?? "",
    seoTitleAr: trAr?.seoTitle ?? "",
    seoDescriptionEn: trEn?.seoDescription ?? "",
    seoDescriptionAr: trAr?.seoDescription ?? "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blocksEn: parseBlocks(trEn?.blocks) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blocksAr: parseBlocks(trAr?.blocks) as any,
  };

  const entities: LinkPickerEntities = {
    pages: pages.map((p) => ({
      id: p.id,
      label: p.translations[0]?.title ?? p.slug,
      url: `/${activeLocale}/${p.slug}`,
    })),
    posts: posts.map((p) => ({
      id: p.id,
      label: p.translations[0]?.title ?? p.slug,
      url: `/${activeLocale}/posts/${p.slug}`,
    })),
    events: events.map((e) => ({
      id: e.id,
      label: e.translations[0]?.title ?? e.slug,
      url: `/${activeLocale}/events/${e.slug}`,
    })),
  };

  return <PageEditor entities={entities} locale={activeLocale} pageData={pageData} />;
}
