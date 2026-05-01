import type { MetadataRoute } from "next";

import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const now = new Date();

  const staticPaths = ["", "/events", "/posts", "/about"];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const path of staticPaths) {
      entries.push({
        changeFrequency: "weekly",
        lastModified: now,
        priority: path === "" ? 1 : 0.8,
        url: `${baseUrl}/${locale}${path}`,
      });
    }
  }

  if (process.env.DATABASE_URL) {
    const [events, posts] = await Promise.all([
      db.event.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }),
      db.post.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }),
    ]);

    for (const locale of SUPPORTED_LOCALES) {
      for (const event of events) {
        entries.push({
          changeFrequency: "weekly",
          lastModified: event.updatedAt,
          priority: 0.7,
          url: `${baseUrl}/${locale}/events/${event.slug}`,
        });
      }
      for (const post of posts) {
        entries.push({
          changeFrequency: "weekly",
          lastModified: post.updatedAt,
          priority: 0.7,
          url: `${baseUrl}/${locale}/posts/${post.slug}`,
        });
      }
    }
  }

  return entries;
}
