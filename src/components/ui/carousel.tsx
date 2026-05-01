"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";

import { cn } from "@/lib/utils";

type CarouselContextProps = {
  api: EmblaCarouselType | undefined;
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) throw new Error("useCarousel must be used within <Carousel />");
  return context;
}

function Carousel({
  children,
  className,
  opts,
  setApi,
}: React.ComponentProps<"div"> & {
  opts?: EmblaOptionsType;
  setApi?: (api: EmblaCarouselType) => void;
}) {
  const [carouselRef, api] = useEmblaCarousel(opts);

  React.useEffect(() => {
    if (api && setApi) setApi(api);
  }, [api, setApi]);

  return (
    <CarouselContext.Provider
      value={{
        api,
        carouselRef,
      }}
    >
      <div className={cn("relative", className)} data-slot="carousel">
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef } = useCarousel();

  return (
    <div className="overflow-hidden" data-slot="carousel-content" ref={carouselRef}>
      <div className={cn("flex", className)} {...props} />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      data-slot="carousel-item"
      role="group"
      {...props}
    />
  );
}

export { Carousel, CarouselContent, CarouselItem };
