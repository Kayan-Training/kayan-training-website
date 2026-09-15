import type { MetadataRoute } from "next";

import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const entries: MetadataRoute.Sitemap = [];

  if (!process.env.DATABASE_URL) {
    const staticPaths = ["", "/events", "/training-courses", "/blog", "/knowledge", "/contact-us"];
    for (const locale of SUPPORTED_LOCALES) {
      for (const path of staticPaths) {
        entries.push({
          changeFrequency: "weekly",
          priority: path === "" ? 1 : 0.8,
          url: `${baseUrl}/${locale}${path}`,
        });
      }
    }
    return entries;
  }

  const [events, posts, pages] = await Promise.all([
    db.event.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true, eventKind: true } }),
    db.post.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }),
    db.page.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }),
  ]);

  const latestEventUpdate = events.reduce<Date | undefined>(
    (latest, e) => (!latest || e.updatedAt > latest ? e.updatedAt : latest),
    undefined,
  );
  const latestPostUpdate = posts.reduce<Date | undefined>(
    (latest, p) => (!latest || p.updatedAt > latest ? p.updatedAt : latest),
    undefined,
  );

  const staticPathDates: Record<string, Date | undefined> = {
    "": undefined,
    "/events": latestEventUpdate,
    "/training-courses": latestEventUpdate,
    "/blog": latestPostUpdate,
    "/knowledge": latestPostUpdate,
    "/contact-us": undefined,
  };

  for (const locale of SUPPORTED_LOCALES) {
    for (const [path, lastModified] of Object.entries(staticPathDates)) {
      entries.push({
        changeFrequency: "weekly",
        ...(lastModified ? { lastModified } : {}),
        priority: path === "" ? 1 : 0.8,
        url: `${baseUrl}/${locale}${path}`,
      });
    }
    for (const event of events) {
      const basePath = event.eventKind === "training_course" ? "training-courses" : "events";
      entries.push({
        changeFrequency: "weekly",
        lastModified: event.updatedAt,
        priority: 0.7,
        url: `${baseUrl}/${locale}/${basePath}/${event.slug}`,
      });
    }
    for (const post of posts) {
      entries.push({
        changeFrequency: "weekly",
        lastModified: post.updatedAt,
        priority: 0.7,
        url: `${baseUrl}/${locale}/blog/${post.slug}`,
      });
    }
    for (const page of pages) {
      if (page.slug === "home") continue;
      entries.push({
        changeFrequency: "weekly",
        lastModified: page.updatedAt,
        priority: 0.7,
        url: `${baseUrl}/${locale}/${page.slug}`,
      });
    }
  }

  return entries;
}
