import { ArrowRight01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

export type EventCardItem = {
  coverImage: string;
  dateLabel: string;
  slug: string;
  tag: string;
  title: string;
};

export function EventCard({ event, locale }: { event: EventCardItem; locale: "ar" | "en" }) {
  return (
    <Link
      href={`/${locale}/events/${event.slug}`}
      className="event-card group flex flex-col bg-surface-container-highest ghost-border"
    >
      <div className="relative h-44 overflow-hidden">
        <Image
          alt={event.title}
          className="object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
          fill
          sizes="(max-width: 1024px) 100vw, 25vw"
          src={event.coverImage}
        />
        <div className="absolute top-3 start-3">
          <span className="badge-teal font-body">{event.tag}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-3 line-clamp-2 text-base font-semibold leading-snug text-on-surface transition-colors group-hover:text-secondary">
          {event.title}
        </h3>
        <div className="mt-auto flex items-center justify-between border-t border-outline-variant/20 pt-4">
          <span className="inline-flex items-center gap-1.5 font-body text-xs text-on-surface-variant">
            <HugeiconsIcon icon={Calendar03Icon} size={13} strokeWidth={1.8} />
            {event.dateLabel}
          </span>
          <HugeiconsIcon className="text-outline rtl:rotate-180 transition-colors group-hover:text-secondary" icon={ArrowRight01Icon} size={18} strokeWidth={1.8} />
        </div>
      </div>
    </Link>
  );
}
