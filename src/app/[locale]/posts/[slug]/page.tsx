import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPostDetailBySlug } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostDetailBySlug(isSupportedLocale(locale) ? locale : "ar", slug);
  if (!post) return {};
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
  };
}

function readPostBody(content: unknown): string {
  if (typeof content === "string") return content;
  if (!content || typeof content !== "object") return "";
  const record = content as { html?: unknown };
  if (typeof record.html === "string") return record.html;
  return "";
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const post = await getPostDetailBySlug(activeLocale, slug);

  if (!post) notFound();

  const body = readPostBody(post.content);

  return (
    <main className="mx-auto w-full max-w-[900px] px-6 py-14 md:px-10 md:py-18">
      <Link
        className="mb-4 inline-flex text-xs uppercase tracking-[0.18em] text-on-surface-variant hover:text-primary"
        href={`/${activeLocale}/posts`}
      >
        {activeLocale === "ar" ? "العودة للمقالات" : "Back to Posts"}
      </Link>
      <h1 className="mb-4 text-4xl font-semibold tracking-tight md:text-5xl">{post.title}</h1>
      <p className="mb-10 text-on-surface-variant">{post.excerpt}</p>
      {body ? (
        <article
          className="prose prose-neutral max-w-none [&_a]:text-primary hover:[&_a]:text-secondary"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      ) : (
        <article className="rounded-lg border border-border/70 bg-card p-6 text-sm text-on-surface-variant">
          {activeLocale === "ar" ? "لا يوجد محتوى تفصيلي لهذا المقال." : "No detailed content available for this post."}
        </article>
      )}
    </main>
  );
}
