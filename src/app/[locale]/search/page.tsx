import type { Metadata } from "next";
import Link from "next/link";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

function toPath(locale: "ar" | "en", type: "event" | "training_course", slug: string) {
  return type === "training_course"
    ? `/${locale}/training-courses/${slug}`
    : `/${locale}/events/${slug}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  return {
    title: activeLocale === "ar" ? "البحث" : "Search",
    description:
      activeLocale === "ar"
        ? "ابحث في الفعاليات والدورات والمقالات والصفحات."
        : "Search across events, training courses, posts, and pages.",
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const hasQuery = query.length >= 2;

  const [events, posts, pages, categories] = hasQuery
    ? await Promise.all([
        db.event.findMany({
          where: {
            status: "published",
            OR: [
              { slug: { contains: query, mode: "insensitive" } },
              { location: { contains: query, mode: "insensitive" } },
              {
                translations: {
                  some: {
                    OR: [
                      { title: { contains: query, mode: "insensitive" } },
                      { shortDescription: { contains: query, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          },
          include: { translations: { where: { locale: activeLocale }, take: 1 } },
          orderBy: { startDate: "desc" },
          take: 30,
        }),
        db.post.findMany({
          where: {
            status: "published",
            OR: [
              { slug: { contains: query, mode: "insensitive" } },
              {
                translations: {
                  some: {
                    OR: [
                      { title: { contains: query, mode: "insensitive" } },
                      { excerpt: { contains: query, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          },
          include: { translations: { where: { locale: activeLocale }, take: 1 } },
          orderBy: { publishedAt: "desc" },
          take: 30,
        }),
        db.page.findMany({
          where: {
            status: "published",
            OR: [
              { slug: { contains: query, mode: "insensitive" } },
              {
                translations: {
                  some: {
                    title: { contains: query, mode: "insensitive" },
                  },
                },
              },
            ],
          },
          include: { translations: { where: { locale: activeLocale }, take: 1 } },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
        db.category.findMany({
          where: {
            OR: [
              { slug: { contains: query, mode: "insensitive" } },
              {
                translations: {
                  some: {
                    name: { contains: query, mode: "insensitive" },
                  },
                },
              },
            ],
          },
          include: { translations: { where: { locale: activeLocale }, take: 1 } },
          take: 20,
        }),
      ])
    : [[], [], [], []];

  const total = events.length + posts.length + pages.length + categories.length;

  return (
    <main className="pt-20">
      <section className="mx-auto w-full max-w-[1200px] px-6 pb-8 md:px-10">
        <h1 className="text-3xl font-semibold text-on-surface">{activeLocale === "ar" ? "البحث" : "Search"}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {activeLocale === "ar"
            ? "ابحث في الفعاليات والدورات التدريبية والمقالات والصفحات والتصنيفات."
            : "Search across events, training courses, posts, pages, and categories."}
        </p>

        <form action={`/${activeLocale}/search`} className="mt-5">
          <input
            className="h-11 w-full border border-outline-variant/40 bg-surface-container-lowest px-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
            defaultValue={query}
            name="q"
            placeholder={activeLocale === "ar" ? "اكتب كلمة البحث..." : "Type your search query..."}
            type="search"
          />
        </form>

        {!hasQuery ? (
          <p className="mt-4 text-sm text-on-surface-variant">
            {activeLocale === "ar" ? "اكتب حرفين على الأقل لبدء البحث." : "Type at least 2 characters to start searching."}
          </p>
        ) : (
          <p className="mt-4 text-sm text-on-surface-variant">
            {activeLocale === "ar" ? `نتائج: ${total}` : `Results: ${total}`}
          </p>
        )}
      </section>

      {hasQuery ? (
        <section className="mx-auto grid w-full max-w-[1200px] gap-6 px-6 pb-12 md:grid-cols-2 md:px-10">
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">{activeLocale === "ar" ? "البرامج" : "Programs"}</h2>
            <div className="space-y-2">
              {events.length === 0 ? <p className="text-sm text-on-surface-variant">{activeLocale === "ar" ? "لا نتائج." : "No results."}</p> : null}
              {events.map((event) => {
                const kind = ((event as { eventKind?: string }).eventKind ?? "event") as "event" | "training_course";
                const title = event.translations[0]?.title ?? event.slug;
                return (
                  <Link className="block border border-outline-variant/20 px-3 py-2 text-sm hover:border-primary/40" href={toPath(activeLocale, kind, event.slug)} key={event.id}>
                    <div className="font-medium text-on-surface">{title}</div>
                    <div className="mt-0.5 text-xs text-on-surface-variant">{kind === "training_course" ? "Training Course" : "Event"} · /{event.slug}</div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">{activeLocale === "ar" ? "المقالات" : "Posts"}</h2>
            <div className="space-y-2">
              {posts.length === 0 ? <p className="text-sm text-on-surface-variant">{activeLocale === "ar" ? "لا نتائج." : "No results."}</p> : null}
              {posts.map((post) => (
                <Link className="block border border-outline-variant/20 px-3 py-2 text-sm hover:border-primary/40" href={`/${activeLocale}/blog/${post.slug}`} key={post.id}>
                  <div className="font-medium text-on-surface">{post.translations[0]?.title ?? post.slug}</div>
                  <div className="mt-0.5 text-xs text-on-surface-variant">/{post.slug}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">{activeLocale === "ar" ? "الصفحات" : "Pages"}</h2>
            <div className="space-y-2">
              {pages.length === 0 ? <p className="text-sm text-on-surface-variant">{activeLocale === "ar" ? "لا نتائج." : "No results."}</p> : null}
              {pages.map((page) => (
                <Link className="block border border-outline-variant/20 px-3 py-2 text-sm hover:border-primary/40" href={`/${activeLocale}/${page.slug}`} key={page.id}>
                  <div className="font-medium text-on-surface">{page.translations[0]?.title ?? page.slug}</div>
                  <div className="mt-0.5 text-xs text-on-surface-variant">/{page.slug}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">{activeLocale === "ar" ? "التصنيفات" : "Categories"}</h2>
            <div className="space-y-2">
              {categories.length === 0 ? <p className="text-sm text-on-surface-variant">{activeLocale === "ar" ? "لا نتائج." : "No results."}</p> : null}
              {categories.map((category) => (
                <div className="block border border-outline-variant/20 px-3 py-2 text-sm" key={category.id}>
                  <div className="font-medium text-on-surface">{category.translations[0]?.name ?? category.slug}</div>
                  <div className="mt-0.5 text-xs text-on-surface-variant">/{category.slug}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
