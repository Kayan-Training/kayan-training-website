"use client";

import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { EmblaCarouselType } from "embla-carousel";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type HomePostCarouselItem = {
  excerpt: string;
  image: string | null;
  publishedLabel: string;
  slug: string;
  title: string;
};

export function HomePostsCarouselRail({
  items,
  locale,
}: {
  items: HomePostCarouselItem[];
  locale: "ar" | "en";
}) {
  const [api, setApi] = useState<EmblaCarouselType>();
  const [isMobile, setIsMobile] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!api) return;

    const update = () => {
      setCanPrev(api.canScrollPrev());
      setCanNext(api.canScrollNext());
    };

    update();
    api.on("select", update);
    api.on("reInit", update);

    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  return (
    <div className="relative -mx-6 md:mx-0">
      <Carousel
        className="w-full"
        opts={{
          align: isMobile ? "center" : "start",
          containScroll: false,
          direction: locale === "ar" ? "rtl" : "ltr",
          dragThreshold: 8,
          dragFree: false,
          duration: 20,
          skipSnaps: false,
        }}
        setApi={setApi}
      >
        <CarouselContent className="ml-0 px-6 md:px-0">
          {items.map((post) => (
            <CarouselItem
              className="basis-[82vw] ps-0 pe-4 sm:basis-[340px]"
              key={post.slug}
            >
              <Link
                className="group relative min-h-[420px] w-full max-w-[360px] overflow-hidden ghost-border transition-all duration-300 hover:border-secondary/40 flex"
                href={`/${locale}/blog/${post.slug}`}
              >
                {post.image ? (
                  <Image
                    alt={post.title}
                    className="object-cover grayscale transition-[filter] duration-500 group-hover:grayscale-0"
                    fill
                    sizes="(max-width: 768px) 82vw, 340px"
                    src={post.image}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(145deg,#151818_0%,#1b2a25_60%,#0f1212_100%)]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(13,15,15,0.97)_0%,rgba(13,15,15,0.58)_56%,rgba(13,15,15,0.12)_100%)]" />
                <div className="relative z-10 flex flex-1 flex-col p-5">
                  <span className="badge-teal mb-3 w-fit font-body">
                    {locale === "ar" ? "معرفة" : "Knowledge"}
                  </span>
                  <h3 className="mb-3 mt-auto line-clamp-3 text-xl font-semibold leading-snug transition-colors group-hover:text-secondary">
                    {post.title}
                  </h3>
                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-on-surface-variant">
                    {post.excerpt}
                  </p>
                  <div className="text-xs text-on-surface-variant border-t border-outline-variant/60 pt-4 flex gap-2 items-center">
                    <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
                    {post.publishedLabel}
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 w-8 transition-opacity duration-200",
          locale === "ar"
            ? "right-0 bg-linear-to-l from-surface to-transparent"
            : "left-0 bg-linear-to-r from-surface to-transparent",
          canPrev ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 w-8 transition-opacity duration-200",
          locale === "ar"
            ? "left-0 bg-linear-to-r from-surface to-transparent"
            : "right-0 bg-linear-to-l from-surface to-transparent",
          canNext ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
