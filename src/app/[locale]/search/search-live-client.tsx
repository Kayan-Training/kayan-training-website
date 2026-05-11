"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EventCard } from "@/components/events/event-card";
import { Spinner } from "@/components/ui/spinner";

type SearchPayload = {
  categories: Array<{ id: string; name: string; slug: string }>;
  events: Array<{
    coverImage: string | null;
    eventKind: string;
    id: string;
    slug: string;
    startDate: string;
    title: string;
  }>;
  pages: Array<{ id: string; slug: string; title: string }>;
  posts: Array<{
    excerpt: string;
    featuredImage: string | null;
    id: string;
    publishedAt: string | null;
    slug: string;
    title: string;
  }>;
  total: number;
};

const emptyResults: SearchPayload = {
  categories: [],
  events: [],
  pages: [],
  posts: [],
  total: 0,
};

function formatDate(value: string | null, locale: "ar" | "en") {
  if (!value) return locale === "ar" ? "بدون تاريخ" : "No date";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      <div className="h-20 animate-pulse rounded-lg bg-surface-container-lowest/60" />
      <div className="h-20 animate-pulse rounded-lg bg-surface-container-lowest/40" />
      <div className="h-20 animate-pulse rounded-lg bg-surface-container-lowest/30" />
    </div>
  );
}

export function SearchLiveClient({
  initialQuery,
  locale,
}: {
  initialQuery: string;
  locale: "ar" | "en";
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchPayload>(emptyResults);
  const [isLoading, setIsLoading] = useState(initialQuery.trim().length >= 2);
  const [hasSearched, setHasSearched] = useState(initialQuery.trim().length >= 2);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(emptyResults);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?locale=${encodeURIComponent(locale)}&q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as SearchPayload;
        setResults(payload);
        setHasSearched(true);
      } catch {
        setResults(emptyResults);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [locale, query]);

  const hasAnyResults = useMemo(() => results.total > 0, [results.total]);

  return (
    <>
      <div className="mt-5">
        <input
          className="h-11 w-full border border-outline-variant/40 bg-surface-container-lowest px-4 text-sm text-on-surface placeholder:text-on-surface-variant transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={locale === "ar" ? "اكتب كلمة البحث..." : "Type your search query..."}
          type="search"
          value={query}
        />
      </div>

      {query.trim().length < 2 ? (
        <p className="mt-4 text-sm text-on-surface-variant">
          {locale === "ar" ? "اكتب حرفين على الأقل لبدء البحث." : "Type at least 2 characters to start searching."}
        </p>
      ) : (
        <p className="mt-4 flex items-center gap-2 text-sm text-on-surface-variant">
          {isLoading ? <Spinner className="size-4" /> : null}
          {locale === "ar" ? `نتائج: ${results.total}` : `Results: ${results.total}`}
        </p>
      )}

      <section className="mx-auto w-full max-w-[1200px] space-y-12 px-0 pb-12 pt-8">
        {isLoading ? <LoadingRows /> : null}
        {!isLoading && hasSearched && !hasAnyResults ? (
          <p className="text-sm text-on-surface-variant">
            {locale === "ar" ? "لا نتائج مطابقة." : "No matching results."}
          </p>
        ) : null}

        {!isLoading && results.events.length > 0 ? (
          <section className="animate-in fade-in duration-200">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-primary">
              {locale === "ar" ? "البرامج" : "Programs"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.events.map((event) => {
                const isTrainingCourse = event.eventKind === "training_course";
                return (
                  <EventCard
                    basePath={isTrainingCourse ? "training-courses" : "events"}
                    event={{
                      coverImage:
                        event.coverImage ??
                        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",
                      dateLabel: formatDate(event.startDate, locale),
                      slug: event.slug,
                      tag:
                        isTrainingCourse
                          ? locale === "ar"
                            ? "دورة تدريبية"
                            : "Training Course"
                          : locale === "ar"
                            ? "فعالية"
                            : "Event",
                      title: event.title,
                    }}
                    key={event.id}
                    locale={locale}
                  />
                );
              })}
            </div>
          </section>
        ) : null}

        {!isLoading && results.posts.length > 0 ? (
          <section className="animate-in fade-in duration-200">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-primary">
              {locale === "ar" ? "المقالات" : "Posts"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.posts.map((post, index) => (
                <Link
                  className="post-card group relative block min-h-[360px] overflow-hidden ghost-border"
                  href={`/${locale}/blog/${post.slug}`}
                  key={post.id}
                >
                  <Image
                    alt=""
                    className="absolute inset-0 h-full w-full scale-105 object-cover grayscale transition-all duration-700 group-hover:scale-100 group-hover:grayscale-0"
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    src={
                      post.featuredImage ??
                      `https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=${900 + index}&q=80`
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/70 to-surface-container-lowest/35" />
                  <div className="relative z-10 flex h-full flex-col justify-end p-6">
                    <span className="badge-teal mb-3 w-fit">
                      {locale === "ar" ? "تحليل" : "Analysis"}
                    </span>
                    <h3 className="mb-3 line-clamp-2 text-xl font-semibold leading-snug text-on-surface transition-colors group-hover:text-secondary">
                      {post.title}
                    </h3>
                    <p className="mb-5 line-clamp-3 text-sm leading-6 text-on-surface-variant">
                      {post.excerpt || "—"}
                    </p>
                    <div className="border-t border-outline-variant/40 pt-4 font-mono text-xs text-secondary">
                      {formatDate(post.publishedAt, locale)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {!isLoading && results.pages.length > 0 ? (
          <section className="animate-in fade-in duration-200">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-primary">
              {locale === "ar" ? "الصفحات" : "Pages"}
            </h2>
            <div className="max-w-4xl space-y-6">
              {results.pages.map((page) => (
                <Link className="group block" href={`/${locale}/${page.slug}`} key={page.id}>
                  <p className="text-xs text-on-surface-variant">{`kayan.om / ${locale} / ${page.slug}`}</p>
                  <h3 className="mt-1 text-2xl font-medium text-[#8ab4f8] transition-colors group-hover:text-[#aecbfa]">
                    {page.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    {locale === "ar" ? `صفحة حول ${page.title}` : `Page about ${page.title}`}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {!isLoading && results.categories.length > 0 ? (
          <section className="animate-in fade-in duration-200">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-primary">
              {locale === "ar" ? "التصنيفات" : "Categories"}
            </h2>
            <div className="max-w-4xl space-y-6">
              {results.categories.map((category) => (
                <div className="block" key={category.id}>
                  <p className="text-xs text-on-surface-variant">{`kayan.om / categories / ${category.slug}`}</p>
                  <h3 className="mt-1 text-2xl font-medium text-[#8ab4f8]">{category.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    {locale === "ar" ? `تصنيف: ${category.name}` : `Category: ${category.name}`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </>
  );
}

