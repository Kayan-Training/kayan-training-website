import { ArrowRight01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type EventCardItem = {
  categoryIcons?: string[];
  coverImage: string;
  dateLabel: string;
  pathBase?: "events" | "training-courses";
  slug: string;
  tag: string;
  title: string;
  className?: string;
};

export function EventCard({
  event,
  locale,
  className,
  basePath = "events",
}: {
  event: EventCardItem;
  locale: "ar" | "en";
  className?: string;
  basePath?: string;
}) {
  return (
    <Link
      href={`/${locale}/${basePath}/${event.slug}`}
      className={cn(
        "event-card group relative block h-full w-full overflow-hidden ghost-border",
        className,
      )}
    >
      <Image
        alt={event.title}
        className="absolute inset-0 h-full w-full object-cover grayscale transition-[filter] duration-500 group-hover:grayscale-0"
        fill
        quality={72}
        sizes="(max-width: 640px) 82vw, 340px"
        src={event.coverImage}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/95 via-surface-container-lowest/60 to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-end p-5">
        {(event.categoryIcons?.length ?? 0) > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {event.categoryIcons?.map((icon, index) => (
              <Image
                alt=""
                aria-hidden
                className="h-8 w-8 object-contain opacity-100"
                height={32}
                key={`${icon}-${index}`}
                src={icon}
                width={32}
              />
            ))}
          </div>
        ) : (
          <span className="badge-teal font-body mb-3 w-fit">{event.tag}</span>
        )}
        <h3 className="mb-3 line-clamp-2 text-base font-semibold leading-snug text-on-surface transition-colors group-hover:text-secondary">
          {event.title}
        </h3>
        <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4">
          <span className="inline-flex items-center gap-1.5 font-body text-xs text-on-surface-variant">
            <HugeiconsIcon icon={Calendar03Icon} size={13} strokeWidth={1.8} />
            {event.dateLabel}
          </span>
          <HugeiconsIcon
            className="text-outline rtl:rotate-180 transition-colors group-hover:text-secondary"
            icon={ArrowRight01Icon}
            size={18}
            strokeWidth={1.8}
          />
        </div>
      </div>
    </Link>
  );
}
