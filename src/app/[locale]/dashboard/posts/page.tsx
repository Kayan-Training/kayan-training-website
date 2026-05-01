import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { PostsTable, type PostRow } from "./posts-table";

export default async function PostsDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const posts = await db.post.findMany({
    include: { translations: { where: { locale: activeLocale }, take: 1 } },
    orderBy: { publishedAt: "desc" },
  });

  const rows: PostRow[] = posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.translations[0]?.title ?? p.slug,
    status: p.status,
    publishedAt: p.publishedAt,
    locale: activeLocale,
  }));

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">Posts</h1>
        <Link className={buttonVariants({ size: "sm" })} href={`/${activeLocale}/dashboard/posts/new`}>
          New Post
        </Link>
      </div>
      <PostsTable locale={activeLocale} posts={rows} />
    </section>
  );
}
