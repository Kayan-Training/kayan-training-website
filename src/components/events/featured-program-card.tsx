"use client";

import { ArrowRight01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

type FeaturedProgramCardLabels = {
  details: string;
  detailsAndRegister: string;
  featured: string;
  registrationClosed: string;
  registrationNotOpen: string;
};

export type FeaturedProgramCardItem = {
  basePath: "events" | "training-courses";
  coverImage: string;
  dateIso: string;
  excerpt?: string;
  location?: string;
  logo?: string;
  capacity?: number | null;
  registrationsCount?: number;
  registrationsOpen?: boolean;
  slug: string;
  title: string;
};

function formatDayNumber(dateIso: string, locale: "ar" | "en") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-OM-u-nu-latn" : "en-GB", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  }).format(new Date(dateIso).getDate());
}

export function FeaturedProgramCard({
  event,
  labels,
  locale,
  onInteract,
}: {
  event: FeaturedProgramCardItem;
  labels: FeaturedProgramCardLabels;
  locale: "ar" | "en";
  onInteract?: () => void;
}) {
  const hasStarted = new Date(event.dateIso).getTime() <= Date.now();
  const isFull =
    typeof event.capacity === "number" &&
    event.capacity > 0 &&
    (event.registrationsCount ?? 0) >= event.capacity;
  const showNotOpenMessage = event.registrationsOpen === false;
  const statusMessage = hasStarted || isFull
    ? labels.registrationClosed
    : labels.registrationNotOpen;

  return (
    <Link
      href={`/${locale}/${event.basePath}/${event.slug}`}
      className="group relative block h-[460px] overflow-hidden ghost-border md:h-[520px]"
      onClick={onInteract}
    >
      <Image
        alt={event.title}
        className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
        fill
        priority
        sizes="100vw"
        src={event.coverImage}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/95 via-surface-container-lowest/60 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
        <div className="mb-4 flex items-center gap-3">
          <span className="badge-teal font-body">{labels.featured}</span>
          {event.location ? (
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
              <HugeiconsIcon icon={Location01Icon} size={12} strokeWidth={1.8} />
              {event.location}
            </span>
          ) : null}
        </div>

        {event.logo ? (
          <div className="relative mb-4 h-12 w-36 overflow-hidden md:h-14 md:w-44">
            <Image
              alt={`${event.title} logo`}
              className="object-contain object-left rtl:object-right"
              fill
              sizes="176px"
              src={event.logo}
            />
          </div>
        ) : null}

        <h2 className="mb-3 max-w-3xl text-2xl font-semibold leading-snug text-on-surface transition-colors group-hover:text-secondary md:text-4xl">
          {event.title}
        </h2>

        {event.excerpt ? (
          <p className="mb-8 max-w-xl text-sm leading-relaxed text-on-surface-variant">
            {event.excerpt}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-4xl font-semibold leading-none text-on-surface">
              {formatDayNumber(event.dateIso, locale)}
            </span>
            <span className="text-xs uppercase tracking-widest text-on-surface-variant">
              {new Intl.DateTimeFormat(locale === "ar" ? "ar-OM-u-nu-latn" : "en-GB", {
                month: "short",
                year: "numeric",
              }).format(new Date(event.dateIso))}
            </span>
          </div>
          <span className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors group-hover:bg-secondary">
            {event.registrationsOpen === false ? labels.details : labels.detailsAndRegister}
            <HugeiconsIcon className="rtl:rotate-180" icon={ArrowRight01Icon} size={18} strokeWidth={1.8} />
          </span>
        </div>

        {showNotOpenMessage ? (
          <p className="mt-3 text-xs text-secondary">{statusMessage}</p>
        ) : null}
      </div>
    </Link>
  );
}
