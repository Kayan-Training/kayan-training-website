import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { getPostDetailBySlug, getLocalizedPosts } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostDetailBySlug(isSupportedLocale(locale) ? locale : "ar", slug);
  if (!post) return {};
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    openGraph: post.seoImage ? { images: [{ url: post.seoImage }] } : undefined,
  };
}

function readPostBody(content: unknown): string {
  if (typeof content === "string") return content;
  if (!content || typeof content !== "object") return "";
  const record = content as { html?: unknown };
  if (typeof record.html === "string") return record.html;
  return "";
}

function formatDate(date: Date | null, locale: "ar" | "en"): string {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const fallbackHero =
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1800&q=85";

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
  const heroSrc = post.coverImage ?? fallbackHero;

  return (
    <main className="pt-16">
      {/* ── Hero ── */}
      <section className="relative h-[52vh] min-h-[380px] overflow-hidden">
        <Image
          alt={post.title}
          className="absolute inset-0 h-full w-full object-cover grayscale"
          fill
          priority
          sizes="100vw"
          src={heroSrc}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(13,15,15,0.96)_0%,rgba(13,15,15,0.78)_45%,rgba(13,15,15,0.4)_100%)]" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1200px] items-end px-6 pb-12 md:px-10 md:pb-16">
          <div>
            <div className="mb-5 flex items-center gap-3 text-xs text-on-surface-variant">
              <Link className="transition-colors hover:text-on-surface" href={`/${activeLocale}`}>
                {activeLocale === "ar" ? "الرئيسية" : "Home"}
              </Link>
              <span className="text-outline">/</span>
              <Link className="transition-colors hover:text-on-surface" href={`/${activeLocale}/posts`}>
                {activeLocale === "ar" ? "المقالات" : "Posts"}
              </Link>
            </div>
            <span className="badge-teal mb-4 inline-block font-body">
              {activeLocale === "ar" ? "مقال" : "Article"}
            </span>
            <h1 className="mb-4 max-w-4xl text-[clamp(2rem,4.4vw,3.8rem)] font-semibold leading-tight tracking-tight text-on-surface">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-on-surface-variant">
              {post.publishedAt ? (
                <span className="font-mono">{formatDate(post.publishedAt, activeLocale)}</span>
              ) : null}
              {post.publishedAt && post.authorName ? (
                <span className="text-outline">•</span>
              ) : null}
              {post.authorName ? <span>{post.authorName}</span> : null}
            </div>
          </div>
        </div>
      </section>

      {/* ── Content grid ── */}
      <div className="mx-auto grid max-w-[1200px] grid-cols-12 gap-8 px-6 py-10 md:px-10 md:py-14">
        {/* Article */}
        <article className="col-span-12 lg:col-span-8">
          {post.excerpt ? (
            <div className="ghost-border mb-8 bg-surface-container-lowest p-6 md:p-8">
              <h2 className="mb-4 text-xl font-bold">
                {activeLocale === "ar" ? "الخلاصة" : "Summary"}
              </h2>
              <p className="text-sm leading-relaxed text-on-surface-variant">{post.excerpt}</p>
            </div>
          ) : null}

          {body ? (
            <div
              className={[
                "prose prose-sm max-w-none",
                "prose-invert",
                "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-on-surface",
                "prose-p:text-on-surface-variant prose-p:leading-8",
                "prose-a:text-primary hover:prose-a:text-secondary",
                "prose-blockquote:border-s-2 prose-blockquote:border-secondary/70 prose-blockquote:ps-5 prose-blockquote:text-on-surface prose-blockquote:not-italic",
                "prose-strong:text-on-surface",
                "prose-li:text-on-surface-variant",
                "prose-code:text-secondary prose-code:before:content-none prose-code:after:content-none",
              ].join(" ")}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <p className="text-sm text-on-surface-variant">
              {activeLocale === "ar" ? "لا يوجد محتوى لهذا المقال." : "No content available for this post."}
            </p>
          )}
        </article>

        {/* Sidebar */}
        <aside className="col-span-12 space-y-4 lg:col-span-4">
          <div className="ghost-border bg-surface-container-highest p-6">
            <h3 className="mb-4 text-lg font-bold">
              {activeLocale === "ar" ? "تفاصيل المقال" : "Post Details"}
            </h3>
            <dl className="space-y-3 text-sm text-on-surface-variant">
              {post.publishedAt ? (
                <div>
                  <dt className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-outline">
                    {activeLocale === "ar" ? "تاريخ النشر" : "Published"}
                  </dt>
                  <dd className="font-mono text-secondary">{formatDate(post.publishedAt, activeLocale)}</dd>
                </div>
              ) : null}
              {post.authorName ? (
                <div>
                  <dt className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-outline">
                    {activeLocale === "ar" ? "الكاتب" : "Author"}
                  </dt>
                  <dd>{post.authorName}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="ghost-border p-6">
            <Link
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:text-primary"
              href={`/${activeLocale}/posts`}
            >
              <HugeiconsIcon className="rtl:rotate-180" icon={ArrowRight01Icon} size={16} strokeWidth={1.8} />
              {activeLocale === "ar" ? "جميع المقالات" : "All Posts"}
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
