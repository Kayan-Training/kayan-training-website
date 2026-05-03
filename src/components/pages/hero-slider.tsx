"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { HeroBlock, HeroCta } from "@/lib/pages/block-types";
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

function CtaLink({ cta, locale }: { cta: HeroCta; locale: string }) {
  const href = cta.url.startsWith("/") ? `/${locale}${cta.url.replace(/^\/(ar|en)/, "")}` : cta.url;
  if (cta.style === "secondary") {
    return (
      <Link
        className="ghost-border flex items-center gap-3 px-7 py-4 text-[12px] uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface"
        href={href}
      >
        {cta.text}
      </Link>
    );
  }
  return (
    <Link
      className="group flex items-center gap-3 bg-primary-container px-7 py-4 text-[12px] uppercase tracking-widest text-on-primary-container transition-all duration-300 hover:bg-secondary hover:text-surface-dim"
      href={href}
    >
      {cta.text}
    </Link>
  );
}

export function HeroSlider({
  block,
  locale,
  featuredEvent,
}: {
  block: HeroBlock;
  locale: "ar" | "en";
  featuredEvent?: FeaturedEventCard | null;
}) {
  const slides = block.slides ?? [];
  const media = block.media ?? [];

  const [slideIdx, setSlideIdx] = useState(0);
  const [mediaIdx, setMediaIdx] = useState(0);
  const [exiting, setExiting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const overlayAlpha = (block.overlayOpacity ?? 40) / 100;
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

  return (
    <section
      className={cn(
        "relative flex overflow-hidden bg-surface-container-lowest",
        block.fullViewport ? "min-h-screen items-center" : "py-16 md:py-24 items-center",
      )}
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
              <Image
                alt=""
                className={cn("object-cover object-[center_30%]", block.grayscaleMedia !== false && "grayscale")}
                fill
                priority={i === 0}
                sizes="100vw"
                src={m.url}
              />
            </div>
          ))}
          <div
            className="absolute inset-0"
            style={{ background: block.overlayColor ?? "#000000", opacity: overlayAlpha }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(12,14,14,0.97)_0%,rgba(12,14,14,0.82)_40%,rgba(12,14,14,0.45)_100%)]" />
        </>
      ) : null}

      {/* Content grid */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-12 items-center gap-6 px-6 py-20 md:px-10 md:py-28">
        {/* Slide content */}
        <div
          className={cn(
            "col-span-12 transition-all ease-in-out",
            featuredEvent ? "lg:col-span-7 xl:col-span-6" : "lg:col-span-10",
            exiting
              ? "translate-y-[-20px] opacity-0 duration-[500ms]"
              : "translate-y-0 opacity-100 duration-[600ms]",
          )}
        >
          {/* Eyebrow (from block-level if extended, or static branding) */}
          <div className="mb-8 flex items-center gap-3">
            <div className="h-px w-8 bg-secondary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary">
              {locale === "ar" ? "كيان للتدريب والاستشارات • عُمان" : "Kayan Training & Consulting • Oman"}
            </span>
          </div>

          {slide?.heading && (
            <h1
              className="mb-6 font-semibold leading-[1.12] tracking-tight text-on-surface"
              key={slideIdx}
              style={{ fontSize: "clamp(2rem,5.2vw,4.25rem)" }}
            >
              {words.map((word, i) => (
                <span
                  className="inline-block"
                  key={i}
                  style={{
                    animation: `heroWordIn 0.6s ease forwards`,
                    animationDelay: `${i * 55}ms`,
                    opacity: 0,
                  }}
                >
                  {word}
                  {i < words.length - 1 ? " " : ""}
                </span>
              ))}
            </h1>
          )}

          {slide?.subheading && (
            <p
              className="mb-10 max-w-[36rem] leading-relaxed text-on-surface-variant"
              style={{ fontSize: "clamp(0.9rem,1.15vw,1.02rem)" }}
            >
              {slide.subheading}
            </p>
          )}

          {(slide?.ctas ?? []).length > 0 && (
            <div className="flex flex-wrap gap-4">
              {(slide.ctas ?? []).map((cta) => (
                <CtaLink cta={cta} key={cta.id} locale={locale} />
              ))}
            </div>
          )}
        </div>

        {/* Featured event card */}
        {featuredEvent && (
          <div className="col-span-12 hidden lg:col-span-5 lg:col-start-8 lg:block xl:col-span-4 xl:col-start-9">
            <div className="glass-panel ghost-border group relative p-5 xl:p-6">
              <div className="absolute top-0 start-0 h-px w-full bg-gradient-to-r from-secondary/50 to-transparent" />
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-secondary">★</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                    {locale === "ar" ? "الفعالية المميّزة" : "Featured Event"}
                  </span>
                </div>
                <span className="badge-teal font-body">{featuredEvent.location || (locale === "ar" ? "مسقط" : "Muscat")}</span>
              </div>
              <Link className="block" href={`/${locale}/events/${featuredEvent.slug}`}>
                <div className="relative mb-4 h-32 overflow-hidden">
                  <Image
                    alt={featuredEvent.title}
                    className="object-cover grayscale transition-all duration-700 group-hover:scale-100 group-hover:grayscale-0"
                    fill
                    sizes="400px"
                    src={featuredEvent.coverImage}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(13,15,15,0.95),rgba(13,15,15,0.22))]" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-surface/90 to-transparent p-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-xl leading-none text-secondary">
                        {new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-GB", { minimumIntegerDigits: 2 }).format(
                          new Date(featuredEvent.startDate).getDate(),
                        )}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", { month: "short", year: "numeric" }).format(
                          new Date(featuredEvent.startDate),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <h3 className="mb-4 text-lg font-semibold leading-[1.3] text-on-surface transition-colors group-hover:text-secondary">
                  {featuredEvent.title}
                </h3>
                <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-secondary">
                    {locale === "ar" ? "الحجز متاح" : "Registration Open"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-on-surface transition-colors group-hover:text-secondary">
                    {locale === "ar" ? "التفاصيل" : "Details"} →
                  </span>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Slide indicators */}
        {slides.length > 1 && (
          <div className="col-span-12 flex gap-2 lg:col-span-7">
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
