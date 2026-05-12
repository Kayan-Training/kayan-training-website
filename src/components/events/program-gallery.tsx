"use client";

import type { EmblaCarouselType } from "embla-carousel";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

export type ProgramGalleryItem = {
  id: string;
  url: string;
  mimeType: string;
  title: string;
  description: string;
  uploadedBy: string;
  createdAt: string;
};

export function ProgramGallery({
  items,
  locale,
}: {
  items: ProgramGalleryItem[];
  locale: "ar" | "en";
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mainApi, setMainApi] = useState<EmblaCarouselType>();
  const [thumbApi, setThumbApi] = useState<EmblaCarouselType>();
  const overlayRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === "ar";
  const activeItem = activeIndex !== null ? items[activeIndex] : null;

  const metaDate = useMemo(
    () =>
      activeItem
        ? new Intl.DateTimeFormat(locale === "ar" ? "ar-OM-u-nu-latn" : "en-GB", {
            dateStyle: "medium",
          }).format(new Date(activeItem.createdAt))
        : "",
    [activeItem, locale],
  );

  useEffect(() => {
    if (activeIndex === null || !mainApi) return;
    mainApi.scrollTo(activeIndex, true);
  }, [activeIndex, mainApi]);

  useEffect(() => {
    if (!mainApi) return;

    const onSelect = () => {
      const selected = mainApi.selectedScrollSnap();
      setActiveIndex(selected);
      thumbApi?.scrollTo(selected);
    };

    onSelect();
    mainApi.on("select", onSelect);
    mainApi.on("reInit", onSelect);

    return () => {
      mainApi.off("select", onSelect);
      mainApi.off("reInit", onSelect);
    };
  }, [mainApi, thumbApi]);

  useEffect(() => {
    if (activeIndex === null) return;
    overlayRef.current?.focus();
  }, [activeIndex]);

  return (
    <section className="mt-10 min-w-0 border-t border-outline-variant/20 pt-8">
      <h2 className="mb-2 text-xl font-semibold">
        {locale === "ar" ? "معرض البرنامج" : "Program Gallery"}
      </h2>
      <p className="mb-6 text-sm text-on-surface-variant">
        {locale === "ar"
          ? "صور وفيديوهات من هذا البرنامج."
          : "Photos and videos from this program."}
      </p>

      <div className="grid min-w-0 grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <button
            className="group relative min-w-0 aspect-square cursor-pointer overflow-hidden rounded-md border border-outline-variant/30 bg-surface-container-lowest"
            key={item.id}
            type="button"
            onClick={() => setActiveIndex(index)}
          >
            {item.mimeType.startsWith("image/") ? (
              <Image
                alt={item.title}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                fill
                sizes="260px"
                src={item.url}
              />
            ) : (
              <video
                className="h-full w-full object-cover"
                muted
                preload="metadata"
                src={item.url}
              />
            )}
            <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white">
              {item.mimeType.startsWith("image/") ? "image" : "video"}
            </span>
          </button>
        ))}
      </div>

      {activeItem ? (
        <div
          aria-label={locale === "ar" ? "عارض المعرض" : "Gallery lightbox"}
          className="fixed inset-0 z-[80] bg-black/90 p-4 md:p-8"
          dir={isRtl ? "rtl" : "ltr"}
          ref={overlayRef}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setActiveIndex(null);
              return;
            }

            if (event.key === "ArrowLeft") {
              event.preventDefault();
              isRtl ? mainApi?.scrollNext() : mainApi?.scrollPrev();
              return;
            }

            if (event.key === "ArrowRight") {
              event.preventDefault();
              isRtl ? mainApi?.scrollPrev() : mainApi?.scrollNext();
            }
          }}
        >
          <button
            className="absolute right-4 top-4 rounded border border-white/30 px-2 py-1 text-white"
            type="button"
            onClick={() => setActiveIndex(null)}
          >
            <X className="size-4" />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded border border-white/30 p-2 text-white"
            type="button"
            onClick={() => mainApi?.scrollPrev()}
          >
            <ChevronLeft className="size-5" />
          </button>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded border border-white/30 p-2 text-white"
            type="button"
            onClick={() => mainApi?.scrollNext()}
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center gap-4">
            <Carousel
              opts={{ direction: isRtl ? "rtl" : "ltr", loop: true }}
              setApi={setMainApi}
            >
              <CarouselContent>
                {items.map((item) => (
                  <CarouselItem key={item.id}>
                    <div className="flex h-[68vh] w-full items-center justify-center">
                      {item.mimeType.startsWith("image/") ? (
                        <div className="relative h-full w-full">
                          <Image
                            alt={item.title}
                            className="object-contain"
                            fill
                            sizes="100vw"
                            src={item.url}
                          />
                        </div>
                      ) : (
                        <video
                          className="max-h-full w-full"
                          controls
                          src={item.url}
                        />
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            <Carousel
              className="mx-auto w-full max-w-5xl"
              opts={{
                align: "start",
                containScroll: "trimSnaps",
                direction: isRtl ? "rtl" : "ltr",
                dragFree: true,
              }}
              setApi={setThumbApi}
            >
              <CarouselContent className="-ml-2">
                {items.map((item, index) => {
                  const selected = index === activeIndex;
                  return (
                    <CarouselItem
                      className="basis-1/3 pl-2 sm:basis-1/5 md:basis-1/6"
                      key={`${item.id}-thumb`}
                    >
                      <button
                        className={`relative aspect-[4/3] w-full overflow-hidden rounded border ${
                          selected ? "border-secondary" : "border-white/25"
                        }`}
                        type="button"
                        onClick={() => mainApi?.scrollTo(index)}
                      >
                        {item.mimeType.startsWith("image/") ? (
                          <Image
                            alt={item.title}
                            className="object-cover"
                            fill
                            sizes="180px"
                            src={item.url}
                          />
                        ) : (
                          <video
                            className="h-full w-full object-cover"
                            muted
                            preload="metadata"
                            src={item.url}
                          />
                        )}
                      </button>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
          </div>

          <div className="mx-auto mt-4 w-full max-w-6xl text-white">
            <p className="text-sm font-semibold">{activeItem.title}</p>
            {activeItem.description ? (
              <p className="mt-1 text-sm text-white/75">
                {activeItem.description}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-white/60">
              {locale === "ar" ? "رُفع بواسطة" : "Uploaded by"}:{" "}
              {activeItem.uploadedBy} · {metaDate}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
