import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ArrowRight01Icon, BookOpen01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { getListingConfig, getLocalizedKnowledgePosts } from "@/lib/content/queries";
import { isSupportedLocale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const config = await getListingConfig(activeLocale, "knowledge");
  return {
    title: config?.heading || (activeLocale === "ar" ? "مركز المعرفة" : "Knowledge Hub"),
    description:
      config?.subheading ||
      (activeLocale === "ar"
        ? "موارد منتقاة للتطوير المهني والمؤسسي."
        : "Curated resources for professional and institutional development."),
  };
}

function formatDate(date: Date, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const fallbackImages = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80",
  "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=900&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80",
  "https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=900&q=80",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=900&q=80",
];

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const listingConfig = await getListingConfig(activeLocale, "knowledge");
  const posts = await getLocalizedKnowledgePosts(
    activeLocale,
    listingConfig?.resultsPerPage ?? 12,
  );

  const eyebrow =
    listingConfig?.eyebrow || (activeLocale === "ar" ? "الموارد" : "Resources");
  const heading =
    listingConfig?.heading || (activeLocale === "ar" ? "مركز المعرفة" : "Knowledge Hub");
  const subheading =
    listingConfig?.subheading ||
    (activeLocale === "ar"
      ? "موارد منتقاة للتطوير المهني والمؤسسي."
      : "Curated resources for professional and institutional development.");

  const isEmpty = posts.length === 0;

  return (
    <main className="pt-16">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-surface-container-lowest">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 39px,color-mix(in oklch,var(--color-on-surface) 100%,transparent) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,color-mix(in oklch,var(--color-on-surface) 100%,transparent) 40px)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-container-lowest/60 to-surface-container-lowest" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-360 px-6 py-20 md:px-10 md:py-28">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 items-center rounded-full border border-primary/30 bg-primary/10 px-3 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              {eyebrow}
            </span>
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-on-surface md:text-[3.5rem] md:leading-[1.1]">
            {heading}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-on-surface-variant">{subheading}</p>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-outline-variant/20" />

      {/* ── Content ── */}
      <section className="mx-auto w-full max-w-360 px-6 py-14 md:px-10">
        {isEmpty ? (
          <EmptyState locale={activeLocale} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <KnowledgeCard
                image={post.image}
                index={index}
                key={post.slug}
                locale={activeLocale}
                post={post}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function KnowledgeCard({
  image,
  index,
  locale,
  post,
}: {
  image: string | null;
  index: number;
  locale: "ar" | "en";
  post: {
    excerpt: string;
    publishedAt: Date;
    slug: string;
    title: string;
  };
}) {
  const src = image ?? fallbackImages[index % fallbackImages.length];

  return (
    <Link
      className="group relative flex flex-col overflow-hidden ghost-border bg-surface-container-low transition-colors hover:bg-surface-container"
      href={`/${locale}/posts/${post.slug}`}
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          alt=""
          className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          src={src}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
          <HugeiconsIcon className="shrink-0 text-primary" icon={BookOpen01Icon} size={13} strokeWidth={2} />
          <span>{locale === "ar" ? "مورد معرفي" : "Knowledge Resource"}</span>
        </div>

        <h2 className="mb-3 line-clamp-2 text-base font-semibold leading-snug text-on-surface transition-colors group-hover:text-secondary">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="mb-5 line-clamp-3 flex-1 text-xs leading-6 text-on-surface-variant">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-outline-variant/20 pt-4">
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-outline">
            <HugeiconsIcon icon={Clock01Icon} size={11} strokeWidth={2} />
            {formatDate(post.publishedAt, locale)}
          </span>
          <HugeiconsIcon
            className="rtl:rotate-180 text-on-surface-variant transition-all group-hover:translate-x-0.5 group-hover:text-secondary rtl:group-hover:-translate-x-0.5"
            icon={ArrowRight01Icon}
            size={18}
            strokeWidth={2}
          />
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ locale }: { locale: "ar" | "en" }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface-container">
        <HugeiconsIcon className="text-on-surface-variant" icon={BookOpen01Icon} size={28} strokeWidth={1.5} />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-on-surface">
        {locale === "ar" ? "لا توجد موارد بعد" : "No resources yet"}
      </h2>
      <p className="mb-8 max-w-sm text-sm leading-6 text-on-surface-variant">
        {locale === "ar"
          ? "يتم العمل على إضافة الموارد والأدلة المعرفية. تابعنا قريباً."
          : "Knowledge resources and guides are being prepared. Check back soon."}
      </p>
      <Link
        className="inline-flex h-9 items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-high px-5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-highest hover:text-on-surface"
        href={`/${locale}/posts`}
      >
        {locale === "ar" ? "تصفح المقالات" : "Browse Articles"}
        <HugeiconsIcon className="rtl:rotate-180" icon={ArrowRight01Icon} size={16} strokeWidth={2} />
      </Link>
    </div>
  );
}
