"use client";

import { ArrowLeft01Icon, ArrowRight01Icon, Location01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { EmblaCarouselType } from "embla-carousel";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EventCard, type EventCardItem } from "@/components/events/event-card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Spinner } from "@/components/ui/spinner";

type ListingEvent = {
  coverImage: string;
  dateIso: string;
  excerpt: string;
  isFeatured: boolean;
  listingType: "consulting" | "evenings" | "featured" | "training";
  location: string;
  searchText: string;
  slug: string;
  title: string;
};

const DEFAULT_PAGE_SIZE = 8;

function formatDate(dateIso: string, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateIso));
}

function formatDayNumber(dateIso: string, locale: "ar" | "en") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-GB", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  }).format(new Date(dateIso).getDate());
}

export function EventsListingClient({
  basePath = "events",
  eyebrow,
  heading,
  initialEvents,
  initialPastEvents = [],
  locale,
  pageSize = DEFAULT_PAGE_SIZE,
  subheading,
}: {
  basePath?: "events" | "training-courses";
  eyebrow?: string;
  heading?: string;
  initialEvents: ListingEvent[];
  initialPastEvents?: ListingEvent[];
  locale: "ar" | "en";
  pageSize?: number;
  subheading?: string;
}) {
  const listingLabel = basePath === "training-courses"
    ? (locale === "ar" ? "الدورات التدريبية" : "Training Courses")
    : (locale === "ar" ? "الفعاليات" : "Events");
  const [activeFilter, setActiveFilter] = useState<"all" | "consulting" | "evenings" | "featured" | "training">("all");
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [carouselApi, setCarouselApi] = useState<EmblaCarouselType>();
  const pastEvents = useMemo(
    () =>
      initialPastEvents
        .slice()
        .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime()),
    [initialPastEvents],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(inputValue.trim().toLowerCase());
      setIsSearching(false);
      setPage(1);
    }, 280);
    return () => clearTimeout(t);
  }, [inputValue]);

  const filteredEvents = useMemo(
    () =>
      initialEvents.filter((event) => {
        const matchesFilter =
          activeFilter === "all"
            ? true
            : activeFilter === "featured"
              ? event.isFeatured
              : event.listingType === activeFilter;
        const matchesSearch = searchQuery ? event.searchText.includes(searchQuery) : true;
        return matchesFilter && matchesSearch;
      }),
    [activeFilter, initialEvents, searchQuery],
  );

  const filterOptions = useMemo(() => {
    const typeSet = new Set(initialEvents.map((event) => event.listingType));
    const options: Array<{
      key: "all" | "consulting" | "evenings" | "featured" | "training";
      labelAr: string;
      labelEn: string;
    }> = [{ key: "all", labelAr: "الكل", labelEn: "All" }];

    if (typeSet.has("training")) options.push({ key: "training", labelAr: "تدريب", labelEn: "Training" });
    if (typeSet.has("evenings")) options.push({ key: "evenings", labelAr: "أمسيات", labelEn: "Evenings" });
    if (typeSet.has("consulting")) options.push({ key: "consulting", labelAr: "استشارات", labelEn: "Consulting" });
    if (typeSet.has("featured")) options.push({ key: "featured", labelAr: "مميّز", labelEn: "Featured" });

    return options;
  }, [initialEvents]);

  const featuredEvents = useMemo(() => {
    return filteredEvents.filter((event) => event.isFeatured);
  }, [filteredEvents]);
  const featuredSlugs = useMemo(() => new Set(featuredEvents.map((event) => event.slug)), [featuredEvents]);
  const gridPool = useMemo(
    () => filteredEvents.filter((event) => !featuredSlugs.has(event.slug)),
    [featuredSlugs, filteredEvents],
  );
  const totalPagesGrid = Math.max(1, Math.ceil(gridPool.length / pageSize));
  const safePage = Math.min(page, totalPagesGrid);
  const pageEvents = gridPool.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (!carouselApi || featuredEvents.length <= 1) return;
    const timer = window.setInterval(() => {
      if (carouselApi.canScrollNext()) carouselApi.scrollNext();
      else carouselApi.scrollTo(0);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [carouselApi, featuredEvents.length]);

  return (
    <>
      <section className="relative overflow-hidden bg-surface-container-lowest py-16 md:py-24">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "url('https://images.unsplash.com/photo-1582706171447-93bc3838322c?w=1400&q=60') center/cover no-repeat",
            filter: "grayscale(1)",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(13,15,15,0.98)_0%,rgba(13,15,15,0.88)_100%)]" />
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <div className="mb-4 flex items-center gap-3">
            <Link className="text-xs text-on-surface-variant transition-colors hover:text-on-surface" href={`/${locale}`}>
              {locale === "ar" ? "الرئيسية" : "Home"}
            </Link>
            <span className="text-outline">/</span>
            <span className="text-xs text-primary">{listingLabel}</span>
          </div>
          {eyebrow && (
            <span className="mb-3 block text-[11px] font-bold uppercase text-primary">{eyebrow}</span>
          )}
          <h1 className="mb-4 text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-tight tracking-tight text-on-surface">
            {heading ?? (locale === "ar" ? "الفعاليات والبرامج" : "Events & Programs")}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant">
            {subheading ?? (locale === "ar"
              ? "اكتشف برامجنا التدريبية والفعاليات القادمة المصممة لتطوير الكفاءات وتحقيق النمو."
              : "Discover our training programs and upcoming events designed to develop capabilities and achieve growth.")}
          </p>
        </div>
      </section>

      <section className="sticky top-16 z-40 border-b border-outline-variant/20 bg-surface-container">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start justify-between gap-4 px-6 py-4 sm:flex-row sm:items-center md:px-10">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                className={`filter-btn ghost-border inline-flex h-8 items-center px-4 text-[11px] font-semibold uppercase tracking-widest transition-colors ${activeFilter === filter.key ? "active" : "text-on-surface-variant hover:text-primary"}`}
                key={filter.key}
                onClick={() => {
                  setActiveFilter(filter.key as typeof activeFilter);
                  setPage(1);
                }}
                type="button"
              >
                {locale === "ar" ? filter.labelAr : filter.labelEn}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-outline">
              {isSearching ? (
                <Spinner className="size-4 text-primary" />
              ) : (
                <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.8} />
              )}
            </span>
            <input
              className="h-8 w-full border-b border-outline-variant/40 bg-surface-container-high ps-9 pe-4 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary"
              onChange={(event) => {
                setIsSearching(true);
                setInputValue(event.target.value);
              }}
              placeholder={locale === "ar" ? "بحث..." : "Search..."}
              value={inputValue}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 pt-12 md:px-10">
        {featuredEvents.length ? (
          <Carousel
            opts={{
              align: "start",
              direction: locale === "ar" ? "rtl" : "ltr",
              loop: featuredEvents.length > 1,
            }}
            setApi={setCarouselApi}
            className="featured-carousel-shell"
          >
            <CarouselContent>
              {featuredEvents.map((featuredEvent) => (
                <CarouselItem key={featuredEvent.slug}>
                  <Link
                    href={`/${locale}/${basePath}/${featuredEvent.slug}`}
                    className="group relative block h-[480px] overflow-hidden ghost-border md:h-[560px]"
                  >
                    <Image
                      alt={featuredEvent.title}
                      className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                      fill
                      priority
                      sizes="100vw"
                      src={featuredEvent.coverImage}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/95 via-surface-container-lowest/60 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="badge-teal font-body">
                          {locale === "ar" ? "حدث مميّز" : "Featured Event"}
                        </span>
                        {featuredEvent.location ? (
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
                            <HugeiconsIcon icon={Location01Icon} size={12} strokeWidth={1.8} />
                            {featuredEvent.location}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mb-3 max-w-3xl text-2xl font-semibold leading-snug text-on-surface transition-colors group-hover:text-secondary md:text-4xl">
                        {featuredEvent.title}
                      </h2>
                      <p className="mb-8 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                        {featuredEvent.excerpt}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono text-4xl font-semibold leading-none text-on-surface">
                            {formatDayNumber(featuredEvent.dateIso, locale)}
                          </span>
                          <span className="text-xs uppercase tracking-widest text-on-surface-variant">
                            {new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", {
                              month: "short",
                              year: "numeric",
                            }).format(new Date(featuredEvent.dateIso))}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors group-hover:bg-secondary">
                          {locale === "ar" ? "التفاصيل والتسجيل" : "Details & Register"}
                          <HugeiconsIcon className="rtl:rotate-180" icon={ArrowRight01Icon} size={18} strokeWidth={1.8} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : null}
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 py-12 md:px-10">
        <div className="mb-8 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">
            {locale === "ar" ? `عرض ${pageEvents.length} فعاليات` : `Showing ${pageEvents.length} events`}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageEvents.map((event) => {
            const card: EventCardItem = {
              coverImage: event.coverImage,
              dateLabel: formatDate(event.dateIso, locale),
              slug: event.slug,
              tag:
                event.listingType === "consulting"
                  ? locale === "ar" ? "استشارات" : "Consulting"
                  : event.listingType === "evenings"
                    ? locale === "ar" ? "أمسية" : "Evening"
                    : locale === "ar" ? "تدريب" : "Training",
              title: event.title,
            };
            return <EventCard basePath={basePath} event={card} key={event.slug} locale={locale} />;
          })}
        </div>

        <div className="mt-12 flex items-center justify-center gap-2">
          <button aria-label="Previous page" className="ghost-border flex h-9 w-9 items-center justify-center text-on-surface-variant hover:text-primary rtl:rotate-180" onClick={() => setPage((prev) => Math.max(1, prev - 1))} type="button">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.8} />
          </button>
          {Array.from({ length: totalPagesGrid }).map((_, index) => {
            const pageNo = index + 1;
            const active = pageNo === safePage;
            return (
              <button
                className={`flex h-9 w-9 items-center justify-center font-body text-xs ${active ? "bg-primary-container text-primary" : "ghost-border text-on-surface-variant hover:text-primary"}`}
                key={pageNo}
                onClick={() => setPage(pageNo)}
                type="button"
              >
                {pageNo}
              </button>
            );
          })}
          <button aria-label="Next page" className="ghost-border flex h-9 w-9 items-center justify-center text-on-surface-variant hover:text-primary rtl:rotate-180" onClick={() => setPage((prev) => Math.min(totalPagesGrid, prev + 1))} type="button">
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={1.8} />
          </button>
        </div>
      </section>

      {pastEvents.length > 0 ? (
        <section className="mx-auto w-full max-w-[1440px] border-t border-outline-variant/20 px-6 py-12 md:px-10">
          <h2 className="mb-2 text-2xl font-semibold text-on-surface">
            {locale === "ar" ? "البرامج السابقة" : "Past Programs"}
          </h2>
          <p className="mb-8 text-sm text-on-surface-variant">
            {locale === "ar" ? "الفعاليات والدورات التي انتهى موعدها." : "Events and training courses that already concluded."}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pastEvents.slice(0, 12).map((event) => {
              const card: EventCardItem = {
                coverImage: event.coverImage,
                dateLabel: formatDate(event.dateIso, locale),
                slug: event.slug,
                tag: locale === "ar" ? "انتهى" : "Completed",
                title: event.title,
              };
              return <EventCard basePath={basePath} event={card} key={`past-${event.slug}`} locale={locale} />;
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}
