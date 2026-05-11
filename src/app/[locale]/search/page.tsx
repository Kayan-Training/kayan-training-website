import type { Metadata } from "next";
import { isSupportedLocale } from "@/lib/i18n/config";
import { SearchLiveClient } from "./search-live-client";

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

  return (
    <main className="pt-20">
      <section className="mx-auto w-full max-w-[1200px] px-6 pb-8 md:px-10">
        <h1 className="text-3xl font-semibold text-on-surface">{activeLocale === "ar" ? "البحث" : "Search"}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {activeLocale === "ar"
            ? "ابحث في الفعاليات والدورات التدريبية والمقالات والصفحات والتصنيفات."
            : "Search across events, training courses, posts, pages, and categories."}
        </p>
        <SearchLiveClient initialQuery={query} locale={activeLocale} />
      </section>
    </main>
  );
}
