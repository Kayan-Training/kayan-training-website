"use client";

import { StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type AgendaItem = {
  day: number;
  highlighted?: boolean;
  time: string;
  title: string;
  trainerLink?: string;
  trainerName?: string;
};

function timeToMinutes(value: string): number {
  const input = value.trim();
  const twelveHour = input.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (twelveHour) {
    const hoursRaw = Number(twelveHour[1]);
    const minutes = Number(twelveHour[2]);
    const marker = twelveHour[3].toUpperCase();
    const hours = marker === "PM" && hoursRaw !== 12 ? hoursRaw + 12 : marker === "AM" && hoursRaw === 12 ? 0 : hoursRaw;
    return hours * 60 + minutes;
  }

  const twentyFourHour = input.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    return Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2]);
  }

  return Number.MAX_SAFE_INTEGER;
}

export function AgendaDayTabs({
  locale,
  items,
}: {
  locale: "ar" | "en";
  items: AgendaItem[];
}) {
  const agendaByDay = useMemo(() => {
    const grouped = items.reduce<Record<number, AgendaItem[]>>((acc, item) => {
      acc[item.day] = acc[item.day] ?? [];
      acc[item.day].push(item);
      return acc;
    }, {});
    for (const dayItems of Object.values(grouped)) {
      dayItems.sort((a, b) => {
        const minuteDiff = timeToMinutes(a.time) - timeToMinutes(b.time);
        if (minuteDiff !== 0) return minuteDiff;
        return a.title.localeCompare(b.title);
      });
    }

    const days = Object.keys(grouped)
      .map((value) => Number(value))
      .sort((a, b) => a - b);
    return { grouped, days };
  }, [items]);

  const [activeDay, setActiveDay] = useState<number>(agendaByDay.days[0] ?? 1);
  const activeItems = agendaByDay.grouped[activeDay] ?? [];

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {agendaByDay.days.map((day) => (
          <button
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
              activeDay === day
                ? "border-secondary bg-secondary text-surface-dim"
                : "border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-secondary/50 hover:text-on-surface",
            )}
            key={`agenda-tab-${day}`}
            type="button"
            onClick={() => setActiveDay(day)}
          >
            {locale === "ar" ? `اليوم ${day}` : `Day ${day}`}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {activeItems.map((item, index) => (
          <div
            className={cn(
              "flex gap-4 p-3 md:p-4 border",
              item.highlighted
                ? "border-amber-400/70 bg-amber-50/30"
                : index % 2
                  ? "border-transparent bg-surface-container-low"
                  : "border-transparent bg-surface-container-lowest",
            )}
            key={`${item.day}-${item.time}-${item.title}-${index}`}
          >
            <span
              className="w-16 shrink-0 pt-0.5 font-mono flex items-center gap-2 text-xs text-secondary md:w-20"
              dir="ltr"
            >
              {item.highlighted ? (
                <HugeiconsIcon
                  icon={StarIcon}
                  className="text-amber-400 size-4"
                  fill="currentColor"
                />
              ) : null}
              {item.time}
            </span>
            <div className="min-w-0">
              <div className="break-words text-sm font-semibold">
                {item.title}
              </div>
              {item.trainerName ? (
                <div className="mt-1 break-words text-xs text-on-surface-variant">
                  {item.trainerLink ? (
                    <Link
                      className="underline-offset-4 hover:text-primary hover:underline"
                      href={item.trainerLink}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.trainerName}
                    </Link>
                  ) : (
                    item.trainerName
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
