"use client";

import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatedCategoryIcons } from "@/components/shared/animated-category-icons";
import type { AnimatedCategoryIconItem } from "@/lib/content/category-icons";
import type { HeroBlock, HeroCta, HeroMedia } from "@/lib/pages/block-types";
import { cn } from "@/lib/utils";

export type FeaturedEventCard = {
  slug: string;
  title: string;
  location: string;
  startDate: string; // ISO string
  coverImage: string;
};

const SLIDE_INTERVAL = 6000;
const MEDIA_INTERVAL = 8000;
const EXIT_MS = 500;
const EVENT_INTERVAL = 5000;
const EVENT_EXIT_MS = 400;
const HERO_MEDIA_FOCUS_CLASS =
  "object-cover object-[center_30%] md:object-[center_28%] lg:object-[center_24%] xl:object-[center_20%]";

export function PageHeroMediaCycler({
  media,
  overlayColor,
  overlayAlpha,
}: {
  media: HeroMedia[];
  overlayColor: string;
  overlayAlpha: number;
}) {
  const [mediaIdx, setMediaIdx] = useState(0);

  useEffect(() => {
    if (media.length <= 1) return;
    const id = setInterval(() => {
      setMediaIdx((prev) => (prev + 1) % media.length);
    }, MEDIA_INTERVAL);
    return () => clearInterval(id);
  }, [media.length]);

  if (media.length === 0) return null;

  return (
    <>
      {media.map((item, index) => (
        <div
          className="absolute inset-0 transition-opacity duration-[1400ms] ease-in-out"
          key={item.id}
          style={{ opacity: index === mediaIdx ? 1 : 0 }}
        >
          {item.kind === "video" ? (
            <video
              aria-hidden
              autoPlay
              className={cn("h-full w-full", HERO_MEDIA_FOCUS_CLASS)}
              loop
              muted
              playsInline
              preload={index === 0 ? "auto" : "metadata"}
              src={item.url}
            />
          ) : (
            <Image
              alt=""
              className={HERO_MEDIA_FOCUS_CLASS}
              fill
              priority={index === 0}
              sizes="100vw"
              src={item.url}
            />
          )}
        </div>
      ))}
      <div
        className="absolute inset-0"
        style={{ background: overlayColor, opacity: overlayAlpha }}
      />
    </>
  );
}

function CtaLink({ cta, locale }: { cta: HeroCta; locale: string }) {
  const href = cta.url.startsWith("/")
    ? `/${locale}${cta.url.replace(/^\/(ar|en)/, "")}`
    : cta.url;
  if (cta.style === "secondary") {
    return (
      <Link
        className="ghost-border flex items-center gap-3 px-7 py-4 text-[12px] uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface backdrop-blur-sm"
        href={href}
      >
        {cta.text}
      </Link>
    );
  }
  return (
    <Link
      className="group flex items-center gap-3 bg-primary px-7 py-4 text-[12px] uppercase tracking-widest text-primary-foreground transition-all duration-300 hover:bg-primary-container hover:text-on-primary-container"
      href={href}
    >
      {cta.text}
    </Link>
  );
}

export function FeaturedEventCyclerCard({
  events,
  locale,
}: {
  events: FeaturedEventCard[];
  locale: "ar" | "en";
}) {
  const [idx, setIdx] = useState(0);
  const [exiting, setExiting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (events.length <= 1) return;
    const id = setInterval(() => {
      setExiting(true);
      timeoutRef.current = setTimeout(() => {
        setIdx((p) => (p + 1) % events.length);
        setExiting(false);
      }, EVENT_EXIT_MS);
    }, EVENT_INTERVAL);
    return () => {
      clearInterval(id);
      clearTimeout(timeoutRef.current);
    };
  }, [events.length]);

  const ev = events[idx];
  if (!ev) return null;

  const date = new Date(ev.startDate);
  const isAr = locale === "ar";
  const numLocale = isAr ? "ar-OM" : "en-GB";

  const dayStr = new Intl.NumberFormat(numLocale, {
    minimumIntegerDigits: 2,
  }).format(date.getDate());
  const monthStr = new Intl.DateTimeFormat(numLocale, {
    month: "short",
  }).format(date);
  const yearStr = new Intl.DateTimeFormat(numLocale, {
    year: "numeric",
  }).format(date);

  return (
    <div className="relative">
      {/* Ambient glow behind card — pulses between two intensities */}
      <div
        aria-hidden
        className="featured-event-glow-primary pointer-events-none absolute -inset-6 -z-10"
      />

      {/* Secondary softer halo */}
      <div
        aria-hidden
        className="featured-event-glow-secondary pointer-events-none absolute -inset-10 -z-10"
      />

      {/* Card */}
      <Link
        href={`/${locale}/events/${ev.slug}`}
        className={cn(
          "group relative block overflow-hidden ghost-border",
          "h-[420px] xl:h-[460px]",
          "transition-all ease-in-out",
          exiting
            ? "translate-y-2 opacity-0 duration-[400ms]"
            : "translate-y-0 opacity-100 duration-[500ms]",
        )}
      >
        {/* Full-bleed image */}
        <Image
          alt={ev.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 420px"
          src={ev.coverImage}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Bottom-heavy dark gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
        {/* Subtle vignette from left */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-secondary via-secondary/50 to-transparent" />

        {/* Top labels */}
        <div className="absolute inset-x-4 top-4 flex items-start justify-between">
          <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
            <span className="text-[10px] leading-none text-secondary">★</span>
            <span className="hero-micro-text text-[9px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              {isAr ? "الفعالية المميّزة" : "Featured Event"}
            </span>
          </div>
          <span className="badge-teal hero-badge-text font-body !text-[9px] !py-[5px] !px-[8px]">
            {ev.location || (isAr ? "مسقط" : "Muscat")}
          </span>
        </div>

        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 p-5 xl:p-6">
          {/* Date */}
          <div className="mb-3 flex items-end gap-2.5">
            <span className="font-mono text-[3.25rem] font-light leading-none text-secondary">
              {dayStr}
            </span>
            <div className="mb-1 flex flex-col gap-0.5">
              <span className="hero-micro-text text-[10px] font-semibold uppercase tracking-widest text-secondary/90">
                {monthStr}
              </span>
              <span className="hero-micro-text text-[10px] uppercase tracking-widest text-on-surface-variant/60">
                {yearStr}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="mb-4 line-clamp-2 text-[15px] font-semibold leading-snug text-on-surface transition-colors duration-300 group-hover:text-secondary">
            {ev.title}
          </h3>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <div className="flex items-center gap-1.5">
              {/* Pulsing live dot */}
              <span className="featured-event-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-secondary" />
              <span className="hero-micro-text text-[9px] uppercase tracking-[0.18em] text-secondary">
                {isAr ? "الحجز متاح" : "Registration Open"}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-on-surface/60 transition-colors duration-300 group-hover:text-secondary">
              {isAr ? "التفاصيل" : "Details"}
              <HugeiconsIcon
                icon={ArrowRight02Icon}
                className="rtl:rotate-180 size-3.5"
              />
            </span>
          </div>
        </div>
      </Link>

      {/* Cycle indicators — only shown when multiple events */}
      {events.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {events.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Event ${i + 1}`}
              className={cn(
                "h-px rounded-full transition-all duration-300",
                i === idx ? "w-7 bg-secondary" : "w-3 bg-on-surface/20",
              )}
              onClick={() => {
                setExiting(true);
                clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                  setIdx(i);
                  setExiting(false);
                }, EVENT_EXIT_MS);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HeroSlider({
  block,
  locale,
  featuredEvents,
  categoryIcons,
}: {
  block: HeroBlock;
  locale: "ar" | "en";
  featuredEvents?: FeaturedEventCard[] | null;
  categoryIcons?: AnimatedCategoryIconItem[] | null;
}) {
  const slides = block.slides ?? [];
  const media = block.media ?? [];

  const [slideIdx, setSlideIdx] = useState(0);
  const [mediaIdx, setMediaIdx] = useState(0);
  const [exiting, setExiting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const overlayAlpha = (block.overlayOpacity ?? 40) / 100;
  // const overlayAlpha = block.overlayOpacity;
  const slide = slides[slideIdx];

  // Independent media cycling — fade between background images
  useEffect(() => {
    if (media.length <= 1) return;
    const id = setInterval(() => {
      setMediaIdx((p) => (p + 1) % media.length);
    }, MEDIA_INTERVAL);
    return () => clearInterval(id);
  }, [media.length]);

  // Slide content cycling — exit animation → swap → enter
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setExiting(true);
      timeoutRef.current = setTimeout(() => {
        setSlideIdx((p) => (p + 1) % slides.length);
        setExiting(false);
      }, EXIT_MS);
    }, SLIDE_INTERVAL);
    return () => {
      clearInterval(id);
      clearTimeout(timeoutRef.current);
    };
  }, [slides.length]);

  const words = slide?.heading?.split(/\s+/) ?? [];
  const hasEvents = featuredEvents && featuredEvents.length > 0;

  return (
    <section
      className={cn(
        "relative flex overflow-hidden bg-surface-container-lowest",
        block.fullViewport
          ? "min-h-screen items-center"
          : "py-16 md:py-24 items-center",
      )}
      style={{ backgroundColor: block.backgroundColor || "#121414" }}
    >
      {/* Background layers — crossfade independently */}
      {media.length > 0 ? (
        <>
          {media.map((m, i) => (
            <div
              className="absolute inset-0 transition-opacity duration-[1400ms] ease-in-out"
              key={m.id}
              style={{ opacity: i === mediaIdx ? 1 : 0 }}
            >
              {m.kind === "video" ? (
                <video
                  aria-hidden
                  autoPlay
                  className={cn("h-full w-full", HERO_MEDIA_FOCUS_CLASS)}
                  loop
                  muted
                  playsInline
                  preload={i === 0 ? "auto" : "metadata"}
                  src={m.url}
                />
              ) : (
                <Image
                  alt=""
                  className={HERO_MEDIA_FOCUS_CLASS}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  src={m.url}
                />
              )}
            </div>
          ))}
          <div
            className="absolute inset-0"
            style={{
              background: block.overlayColor ?? "#000000",
              opacity: overlayAlpha,
            }}
          />
        </>
      ) : null}

      {/* Content grid */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-12 items-center gap-6 px-6 py-20 md:px-10 md:py-28">
        {/* Slide content */}
        <div
          className={cn(
            "col-span-12 transition-all ease-in-out",
            hasEvents ? "lg:col-span-7 xl:col-span-6" : "lg:col-span-10",
            exiting
              ? "translate-y-[-20px] opacity-0 duration-[500ms]"
              : "translate-y-0 opacity-100 duration-[600ms]",
          )}
        >
          {(slide?.eyebrow?.trim() || block.eyebrow?.trim()) ? (
            <div className="mb-8 flex items-center gap-3">
              <div className="h-px w-8 bg-secondary" />
              <span className="text-[11px] font-semibold uppercase text-secondary">
                {slide?.eyebrow?.trim() || block.eyebrow}
              </span>
            </div>
          ) : null}

          {slide?.heading && (
            <h1
              className="hero-heading mb-6 font-semibold leading-[1.12] tracking-tight text-on-surface"
              key={slideIdx}
            >
              {words.map((word, i) => (
                <span
                  className="hero-word-in inline-block"
                  key={i}
                  style={{ animationDelay: `${i * 55}ms` }}
                >
                  {word}
                </span>
              ))}
            </h1>
          )}

          {slide?.subheading && (
            <p className="hero-subheading mb-10 max-w-xl leading-relaxed text-on-surface-variant">
              {slide.subheading}
            </p>
          )}

          {slide?.showCategoryIcons && (categoryIcons?.length ?? 0) > 0 && (
            <AnimatedCategoryIcons className="mb-10 w-fit" icons={categoryIcons ?? []} />
          )}

          {(slide?.ctas ?? []).length > 0 && (
            <div className="flex flex-wrap gap-4">
              {(slide.ctas ?? []).map((cta) => (
                <CtaLink cta={cta} key={cta.id} locale={locale} />
              ))}
            </div>
          )}
        </div>

        {/* Featured event cycling card */}
        {hasEvents && (
          <div className="col-span-12 hidden lg:col-span-5 lg:col-start-8 lg:block xl:col-span-4 xl:col-start-9">
            <FeaturedEventCyclerCard events={featuredEvents} locale={locale} />
          </div>
        )}

        {/* Slide indicators */}
        {slides.length > 1 && (
          <div
            className={cn(
              "col-span-12 flex gap-2",
              hasEvents ? "lg:col-span-7" : "lg:col-span-10",
            )}
          >
            {slides.map((_, i) => (
              <button
                className={cn(
                  "h-0.5 rounded-full transition-all duration-300",
                  i === slideIdx ? "w-8 bg-secondary" : "w-4 bg-on-surface/20",
                )}
                key={i}
                type="button"
                onClick={() => {
                  setExiting(true);
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = setTimeout(() => {
                    setSlideIdx(i);
                    setExiting(false);
                  }, EXIT_MS);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
