import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") ?? "";
  const query = (searchParams.get("q") ?? "").trim();
  const locale = isSupportedLocale(localeParam) ? localeParam : "ar";
  const hasQuery = query.length >= 2;

  if (!hasQuery) {
    return NextResponse.json({
      categories: [],
      events: [],
      pages: [],
      posts: [],
      total: 0,
    });
  }

  const [events, posts, pages, categories] = await Promise.all([
    db.event.findMany({
      where: {
        status: "published",
        OR: [
          { slug: { contains: query, mode: "insensitive" } },
          { location: { contains: query, mode: "insensitive" } },
          {
            translations: {
              some: {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { shortDescription: { contains: query, mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      },
      include: { translations: { where: { locale }, take: 1 } },
      orderBy: { startDate: "desc" },
      take: 30,
    }),
    db.post.findMany({
      where: {
        status: "published",
        OR: [
          { slug: { contains: query, mode: "insensitive" } },
          {
            translations: {
              some: {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { excerpt: { contains: query, mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      },
      include: {
        translations: { where: { locale }, take: 1 },
        featuredImage: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 30,
    }),
    db.page.findMany({
      where: {
        status: "published",
        OR: [
          { slug: { contains: query, mode: "insensitive" } },
          {
            translations: {
              some: {
                title: { contains: query, mode: "insensitive" },
              },
            },
          },
        ],
      },
      include: { translations: { where: { locale }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    db.category.findMany({
      where: {
        OR: [
          { slug: { contains: query, mode: "insensitive" } },
          {
            translations: {
              some: {
                name: { contains: query, mode: "insensitive" },
              },
            },
          },
        ],
      },
      include: { translations: { where: { locale }, take: 1 } },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    categories: categories.map((category) => ({
      id: category.id,
      name: category.translations[0]?.name ?? category.slug,
      slug: category.slug,
    })),
    events: events.map((event) => ({
      coverImage: event.coverImage,
      eventKind: event.eventKind,
      id: event.id,
      slug: event.slug,
      startDate: event.startDate.toISOString(),
      title: event.translations[0]?.title ?? event.slug,
    })),
    pages: pages.map((page) => ({
      id: page.id,
      slug: page.slug,
      title: page.translations[0]?.title ?? page.slug,
    })),
    posts: posts.map((post) => ({
      excerpt: post.translations[0]?.excerpt ?? "",
      featuredImage: post.featuredImage?.url ?? null,
      id: post.id,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      slug: post.slug,
      title: post.translations[0]?.title ?? post.slug,
    })),
    total: events.length + posts.length + pages.length + categories.length,
  });
}
