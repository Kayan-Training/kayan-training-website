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
  const nodes = readRichNodes(content);
  if (nodes.length > 0) return renderRichNodes(nodes);
  return "";
}

type RichTextNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
};

function readRichNodes(content: unknown): RichTextNode[] {
  if (!content || typeof content !== "object") return [];
  const record = content as { type?: unknown; content?: unknown };
  if (record.type !== "doc" || !Array.isArray(record.content)) return [];
  return record.content as RichTextNode[];
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInline(nodes: RichTextNode[] | undefined): string {
  if (!Array.isArray(nodes)) return "";
  return nodes
    .map((node) => {
      if (node.type === "text") return escapeHtml(node.text ?? "");
      if (node.type === "hardBreak") return "<br />";
      if (node.type === "image") return "";
      if (node.type === "paragraph") return renderInline(node.content);
      if (node.type === "listItem") return renderInline(node.content);
      if (node.type === "bulletList" || node.type === "orderedList") {
        return renderRichNodes(node.content ?? []);
      }
      if (Array.isArray(node.content)) return renderInline(node.content);
      return "";
    })
    .join("");
}

function renderRichNodes(nodes: RichTextNode[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "heading": {
          const levelRaw = node.attrs?.level;
          const level = typeof levelRaw === "number" && levelRaw >= 1 && levelRaw <= 6 ? levelRaw : 2;
          return `<h${level}>${renderInline(node.content)}</h${level}>`;
        }
        case "paragraph":
          return `<p>${renderInline(node.content)}</p>`;
        case "bulletList":
          return `<ul>${(node.content ?? [])
            .map((item) => `<li>${renderInline(item.content)}</li>`)
            .join("")}</ul>`;
        case "orderedList":
          return `<ol>${(node.content ?? [])
            .map((item) => `<li>${renderInline(item.content)}</li>`)
            .join("")}</ol>`;
        case "image": {
          const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
          if (!src) return "";
          const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
          return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />`;
        }
        case "blockquote":
          return `<blockquote>${renderRichNodes(node.content ?? [])}</blockquote>`;
        default:
          return renderInline(node.content);
      }
    })
    .join("");
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
  const [post, localizedPosts] = await Promise.all([
    getPostDetailBySlug(activeLocale, slug),
    getLocalizedPosts(activeLocale, 6),
  ]);

  if (!post) notFound();

  const body = readPostBody(post.content);
  const heroSrc = post.coverImage ?? fallbackHero;
  const relatedPosts = localizedPosts.filter((item) => item.slug !== post.slug).slice(0, 4);

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
              <Link className="transition-colors hover:text-on-surface" href={`/${activeLocale}/blog`}>
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
              {activeLocale === "ar" ? "مقالات أخرى" : "Related Posts"}
            </h3>
            {relatedPosts.length > 0 ? (
              <div className="space-y-4">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    className="group flex items-start gap-3 border-b border-outline-variant/20 pb-4 last:border-0 last:pb-0"
                    href={`/${activeLocale}/blog/${relatedPost.slug}`}
                    key={relatedPost.slug}
                  >
                    <div className="relative h-14 w-20 flex-none overflow-hidden rounded-sm bg-surface-container">
                      <Image
                        alt={relatedPost.title}
                        className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                        fill
                        sizes="80px"
                        src={relatedPost.image ?? fallbackHero}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-secondary">
                        {relatedPost.title}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-on-surface-variant">
                        {formatDate(relatedPost.publishedAt, activeLocale)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">
                {activeLocale === "ar" ? "لا توجد مقالات أخرى حالياً." : "No related posts available yet."}
              </p>
            )}
          </div>

          <div className="ghost-border p-6">
            <Link
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:text-primary"
              href={`/${activeLocale}/blog`}
            >
              {activeLocale === "ar" ? "جميع المقالات" : "All Posts"}
              <HugeiconsIcon className="rtl:rotate-180" icon={ArrowRight01Icon} size={16} strokeWidth={1.8} />
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
