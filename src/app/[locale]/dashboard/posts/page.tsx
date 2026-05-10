import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { type PostRow, PostsTable } from "./posts-table";

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
    <section className="mx-auto max-w-6xl space-y-5 p-3 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage knowledge content and article publishing states.
          </p>
        </div>

        <Link
          className={cn(
            buttonVariants(),
            "inline-flex h-10 items-center text-xs font-semibold transition-colors  cursor-pointer rounded-[4px] bg-linear-to-t from-black/10 from-20% via-black/5 via-40% to-transparent border-primary border",
          )}
          href={`/${activeLocale}/dashboard/blog/new`}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
          {activeLocale === "ar" ? "منشور جديد" : "New Blog Post"}
        </Link>
      </div>
      <PostsTable locale={activeLocale} posts={rows} />
    </section>
  );
}
