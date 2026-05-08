import Link from "next/link";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { PostsTable, type PostRow } from "./posts-table";

export const metadata = { title: "Blog" };

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
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage knowledge content and article publishing states.
          </p>
        </div>
        <Link
          className={buttonVariants({ size: "sm" })}
          href={`/${activeLocale}/dashboard/blog/new`}
        >
          <Plus className="mr-1.5 size-3.5" />
          New Blog Post
        </Link>
      </div>
      <PostsTable locale={activeLocale} posts={rows} />
    </section>
  );
}
