"use client";

import type { EmblaCarouselType } from "embla-carousel";
import { useEffect, useMemo, useState } from "react";

import {
  FeaturedProgramCard,
  type FeaturedProgramCardItem,
} from "@/components/events/featured-program-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PopupEvent = FeaturedProgramCardItem & {
  updatedAtIso: string;
};

const COOKIE_KEY = "kayan_featured_popup_state";
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const AUTO_ADVANCE_MS = 3800;

type PopupCookie = {
  dismissedUntil: number;
  signature: string;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function writeCookie(name: string, value: string, expiresAt: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${new Date(expiresAt).toUTCString()}; samesite=lax`;
}

export function FeaturedProgramsPopup({
  events,
  locale,
}: {
  events: PopupEvent[];
  locale: "ar" | "en";
}) {
  const [open, setOpen] = useState(false);
  const [api, setApi] = useState<EmblaCarouselType>();

  const signature = useMemo(
    () =>
      events.map((event) => `${event.slug}:${event.updatedAtIso}`).join("|"),
    [events],
  );

  useEffect(() => {
    if (!events.length) return;

    const now = Date.now();
    const rawCookie = readCookie(COOKIE_KEY);
    if (!rawCookie) {
      setOpen(true);
      return;
    }

    try {
      const parsed = JSON.parse(rawCookie) as PopupCookie;
      const signatureChanged = parsed.signature !== signature;
      const expired =
        !Number.isFinite(parsed.dismissedUntil) || parsed.dismissedUntil <= now;

      if (signatureChanged || expired) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, [events.length, signature]);

  useEffect(() => {
    if (!api || events.length <= 1 || !open) return;
    const timer = window.setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [api, events.length, open]);

  if (!events.length) return null;

  const labels = {
    details: locale === "ar" ? "التفاصيل" : "Details",
    detailsAndRegister:
      locale === "ar" ? "التفاصيل والتسجيل" : "Details & Register",
    featured: locale === "ar" ? "برنامج مميّز" : "Featured Program",
    registrationClosed:
      locale === "ar"
        ? "تم إغلاق التسجيل لهذا البرنامج."
        : "Registration is closed for this program.",
    registrationNotOpen:
      locale === "ar"
        ? "التسجيل غير مفتوح حالياً. سنعلن الموعد قريباً."
        : "Registration is not open yet. We will announce the opening soon.",
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          const dismissedUntil = Date.now() + SIX_HOURS_MS;
          writeCookie(
            COOKIE_KEY,
            JSON.stringify({ dismissedUntil, signature }),
            dismissedUntil,
          );
        }
      }}
    >
      <DialogContent
        className="max-w-[calc(100%-1.5rem)] sm:max-w-4xl p-0"
        closeButtonClassName="top-3 right-3 rounded-full cursor-pointer text-white hover:bg-black/75 hover:text-white size-8"
        showCloseButton
      >
        {/* <DialogHeader>
          <DialogTitle>
            {locale === "ar"
              ? "برامج قادمة مميزة"
              : "Upcoming Featured Programs"}
          </DialogTitle>
          <DialogDescription>
            {locale === "ar"
              ? "اكتشف أحدث البرامج المميزة المتاحة الآن."
              : "Explore the latest featured programs now available."}
          </DialogDescription>
        </DialogHeader> */}

        <Carousel
          className="w-full"
          opts={{
            align: "start",
            direction: locale === "ar" ? "rtl" : "ltr",
            loop: events.length > 1,
          }}
          setApi={setApi}
        >
          <CarouselContent>
            {events.map((event) => (
              <CarouselItem key={event.slug}>
                <FeaturedProgramCard
                  event={event}
                  labels={labels}
                  locale={locale}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </DialogContent>
    </Dialog>
  );
}
