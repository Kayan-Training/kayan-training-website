"use client";

import { useEffect, useState } from "react";

function getCountdownParts(target: string) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

const initialParts = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export function FeaturedCountdown({
  locale,
  targetIso,
}: {
  locale: "ar" | "en";
  targetIso: string;
}) {
  const [parts, setParts] = useState(initialParts);
  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });

  useEffect(() => {
    setParts(getCountdownParts(targetIso));
    const timer = window.setInterval(() => {
      setParts(getCountdownParts(targetIso));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [targetIso]);

  return (
    <div className="grid w-fit grid-cols-4 gap-2">
      {[
        { key: "days", value: parts.days },
        { key: "hours", value: parts.hours },
        { key: "minutes", value: parts.minutes },
        { key: "seconds", value: parts.seconds },
      ].map((item) => (
        <div className="w-[72px]" key={item.key}>
          <div className="mb-1 text-center text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">
            {locale === "ar"
              ? item.key === "days"
                ? "أيام"
                : item.key === "hours"
                  ? "ساعات"
                  : item.key === "minutes"
                    ? "دقائق"
                    : "ثوانٍ"
              : item.key}
          </div>
          <div className="bg-surface-container-low py-3 text-center font-mono text-3xl font-semibold">
            {formatter.format(item.value)}
          </div>
        </div>
      ))}
    </div>
  );
}
