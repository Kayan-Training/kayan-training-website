import Link from "next/link";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

export default async function PostsDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const posts = await db.post.findMany({
    include: {
      translations: {
        take: 1,
        where: { locale: activeLocale },
      },
      author: {
        select: { name: true, email: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{activeLocale === "ar" ? "إدارة المقالات" : "Manage Posts"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{activeLocale === "ar" ? "جميع المقالات والمحتوى المعرفي." : "All article and knowledge content."}</p>
          </div>
          <Link className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary/90" href={`/${activeLocale}/dashboard/posts/new`}>
            {activeLocale === "ar" ? "مقال جديد" : "New Post"}
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Author</th>
              <th className="px-4 py-3 text-left">Updated</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr className="border-t border-border/60" key={post.id}>
                <td className="px-4 py-3">
                  <Link className="font-medium text-foreground hover:text-primary" href={`/${activeLocale}/dashboard/posts/${post.id}`}>
                    {post.translations[0]?.title ?? post.slug}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{post.status}</td>
                <td className="px-4 py-3 text-muted-foreground">{post.author.name ?? post.author.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Intl.DateTimeFormat(activeLocale === "ar" ? "ar-OM" : "en-GB", { dateStyle: "medium" }).format(post.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
