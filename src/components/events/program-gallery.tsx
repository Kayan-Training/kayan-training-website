"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

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
  const activeItem = activeIndex !== null ? items[activeIndex] : null;
  const metaDate = useMemo(
    () =>
      activeItem
        ? new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", {
            dateStyle: "medium",
          }).format(new Date(activeItem.createdAt))
        : "",
    [activeItem, locale],
  );

  function go(delta: number) {
    if (activeIndex === null) return;
    const next = (activeIndex + delta + items.length) % items.length;
    setActiveIndex(next);
  }

  return (
    <section className="mt-10 border-t border-outline-variant/20 pt-8">
      <h2 className="mb-2 text-xl font-semibold">
        {locale === "ar" ? "معرض البرنامج" : "Program Gallery"}
      </h2>
      <p className="mb-6 text-sm text-on-surface-variant">
        {locale === "ar"
          ? "صور وفيديوهات من هذا البرنامج."
          : "Photos and videos from this program."}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <button
            className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-md border border-outline-variant/30 bg-surface-container-lowest"
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
        <div className="fixed inset-0 z-[80] bg-black/90 p-4 md:p-8">
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
            onClick={() => go(-1)}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded border border-white/30 p-2 text-white"
            type="button"
            onClick={() => go(1)}
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-center">
            {activeItem.mimeType.startsWith("image/") ? (
              <div className="relative h-[70vh] w-full">
                <Image
                  alt={activeItem.title}
                  className="object-contain"
                  fill
                  sizes="100vw"
                  src={activeItem.url}
                />
              </div>
            ) : (
              <video
                className="max-h-[70vh] w-full"
                controls
                src={activeItem.url}
              />
            )}
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
