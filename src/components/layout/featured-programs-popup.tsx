"use client";

import type { EmblaCarouselType } from "embla-carousel";
import { usePathname } from "next/navigation";
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
} from "@/components/ui/dialog";

export type FeaturedProgramsPopupEvent = FeaturedProgramCardItem & {
  eventId: string;
  updatedAtIso: string;
};

const COOKIE_KEY = "kayan_featured_popup_state";
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const AUTO_ADVANCE_MS = 3800;

type PopupCookie = {
  dismissedUntil: number;
  signatureHash: string;
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

async function hashSignature(raw: string): Promise<string> {
  if (!raw) return "";
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoded = new TextEncoder().encode(raw);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return raw;
}

export function FeaturedProgramsPopup({
  events: initialEvents,
  locale,
}: {
  events: FeaturedProgramsPopupEvent[];
  locale: "ar" | "en";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [api, setApi] = useState<EmblaCarouselType>();
  const [events, setEvents] = useState<FeaturedProgramsPopupEvent[]>(initialEvents);
  const [signatureHash, setSignatureHash] = useState<string>("");

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    let cancelled = false;

    async function refreshFeaturedPrograms() {
      try {
        const response = await fetch(`/api/featured-programs?locale=${locale}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          events?: FeaturedProgramsPopupEvent[];
        };
        if (!cancelled && Array.isArray(payload.events)) {
          setEvents(payload.events);
        }
      } catch {
        // Swallow fetch failures; popup will keep last known state.
      }
    }

    void refreshFeaturedPrograms();
    return () => {
      cancelled = true;
    };
  }, [locale, pathname]);

  const rawSignature = useMemo(
    () =>
      events.map((event) => `${event.eventId}:${event.updatedAtIso}`).join("|"),
    [events],
  );

  useEffect(() => {
    let cancelled = false;
    async function computeHash() {
      const nextHash = await hashSignature(rawSignature);
      if (!cancelled) {
        setSignatureHash(nextHash);
      }
    }
    void computeHash();
    return () => {
      cancelled = true;
    };
  }, [rawSignature]);

  useEffect(() => {
    if (!events.length || !signatureHash) return;

    const now = Date.now();
    const rawCookie = readCookie(COOKIE_KEY);
    if (!rawCookie) {
      setOpen(true);
      return;
    }

    try {
      const parsed = JSON.parse(rawCookie) as PopupCookie;
      const signatureChanged = parsed.signatureHash !== signatureHash;
      const expired =
        !Number.isFinite(parsed.dismissedUntil) || parsed.dismissedUntil <= now;

      if (signatureChanged || expired) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, [events.length, signatureHash]);

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
            JSON.stringify({ dismissedUntil, signatureHash }),
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
