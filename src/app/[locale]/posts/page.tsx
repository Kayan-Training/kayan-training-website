import Image from "next/image";
import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { getLocalizedPosts } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";

const fallbackImages = [
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=80",
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=80",
  "https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=900&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&q=80",
];

function formatPostDate(date: Date, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function PostCard({
  image,
  index,
  locale,
  post,
}: {
  image: string | null;
  index: number;
  locale: "ar" | "en";
  post: Awaited<ReturnType<typeof getLocalizedPosts>>[number];
}) {
  return (
    <Link
      className="post-card group relative block min-h-[360px] overflow-hidden ghost-border"
      href={`/${locale}/posts/${post.slug}`}
    >
      <Image
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover grayscale transition-all duration-700 group-hover:scale-100 group-hover:grayscale-0"
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        src={image ?? fallbackImages[index % fallbackImages.length]}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/70 to-surface-container-lowest/35" />
      <div className="relative z-10 flex h-full flex-col justify-end p-6">
        <span className="badge-teal mb-3 w-fit">{locale === "ar" ? "تحليل" : "Analysis"}</span>
        <h2 className="mb-3 line-clamp-2 text-xl font-semibold leading-snug text-on-surface transition-colors group-hover:text-secondary">
          {post.title}
        </h2>
        <p className="mb-5 line-clamp-3 text-sm leading-6 text-on-surface-variant">{post.excerpt || "—"}</p>
        <div className="flex items-center justify-between border-t border-outline-variant/40 pt-4">
          <span className="font-mono text-xs text-secondary">{formatPostDate(post.publishedAt, locale)}</span>
          <HugeiconsIcon className="rtl:rotate-180 text-on-surface-variant transition-colors group-hover:text-secondary" icon={ArrowRight01Icon} size={20} strokeWidth={2} />
        </div>
      </div>
    </Link>
  );
}

export default async function PostsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const posts = await getLocalizedPosts(activeLocale);
  const [featured, ...rest] = posts;

  return (
    <main className="pt-16">
      <section className="relative overflow-hidden bg-surface-container-lowest py-16 md:py-24">
        <div className="absolute inset-0 opacity-25">
          <Image
            alt=""
            className="object-cover grayscale"
            fill
            priority
            sizes="100vw"
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1500&q=60"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest via-surface-container-lowest/95 to-surface-container-lowest/90" />
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.35em] text-secondary">
            {activeLocale === "ar" ? "تحليلات ومقالات" : "Insights & Editorial"}
          </span>
          <h1 className="mb-4 max-w-4xl text-4xl font-semibold tracking-tight text-on-surface md:text-6xl">
            {activeLocale === "ar" ? "مكتبة كيان المعرفية" : "Kayan Knowledge Library"}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
            {activeLocale === "ar"
              ? "محتوى تحليلي وتطبيقي موجه للقيادات والفرق التنفيذية، مع تركيز على الأداء، التحول، وبناء القدرات."
              : "Applied and analytical content for leaders and execution teams, focused on performance, transformation, and capability building."}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 py-12 md:px-10">
        {featured ? (
          <Link className="group relative mb-10 block min-h-[460px] overflow-hidden ghost-border" href={`/${activeLocale}/posts/${featured.slug}`}>
            <Image
              alt=""
              className="absolute inset-0 h-full w-full scale-105 object-cover grayscale transition-all duration-700 group-hover:scale-100 group-hover:grayscale-0"
              fill
              priority
              sizes="100vw"
              src={featured.image ?? fallbackImages[0]}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-surface-container-lowest/45" />
            <div className="relative z-10 flex min-h-[460px] flex-col justify-end p-7 md:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="badge-teal">{activeLocale === "ar" ? "مقال مميز" : "Featured Post"}</span>
                <span className="text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {activeLocale === "ar" ? "استراتيجية وتنفيذ" : "Strategy & Execution"}
                </span>
              </div>
              <h2 className="mb-4 max-w-4xl text-3xl font-semibold leading-tight text-on-surface transition-colors group-hover:text-secondary md:text-5xl">
                {featured.title}
              </h2>
              <p className="mb-6 max-w-3xl text-sm leading-7 text-on-surface-variant md:text-base">{featured.excerpt || "—"}</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-secondary">{formatPostDate(featured.publishedAt, activeLocale)}</span>
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-on-surface-variant transition-colors group-hover:text-on-surface">
                  <span>{activeLocale === "ar" ? "قراءة المقال" : "Read Story"}</span>
                  <HugeiconsIcon className="rtl:rotate-180" icon={ArrowRight01Icon} size={22} strokeWidth={2} />
                </span>
              </div>
            </div>
          </Link>
        ) : null}

        {posts.length === 0 ? (
          <div className="ghost-border p-10 text-center text-sm text-on-surface-variant">
            {activeLocale === "ar" ? "لا توجد مقالات منشورة حالياً." : "No published posts yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, index) => (
              <PostCard image={post.image} index={index + 1} key={post.slug} locale={activeLocale} post={post} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
