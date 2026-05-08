"use client";

import type { EmblaCarouselType } from "embla-carousel";
import { useEffect, useState } from "react";

import { EventCard, type EventCardItem } from "@/components/events/event-card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export function HomeEventsCarouselRail({
  items,
  locale,
}: {
  items: EventCardItem[];
  locale: "ar" | "en";
}) {
  const [api, setApi] = useState<EmblaCarouselType>();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

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
          align: "center",
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
          {items.map((item) => (
            <CarouselItem
              className="basis-[82vw] ps-0 pe-4 sm:basis-[340px]"
              key={item.slug}
            >
              <EventCard
                basePath={item.pathBase ?? "events"}
                className="min-h-[420px] w-full max-w-[360px]"
                event={item}
                locale={locale}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-surface-container-lowest to-transparent transition-opacity duration-200",
          canPrev ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface-container-lowest to-transparent transition-opacity duration-200",
          canNext ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
