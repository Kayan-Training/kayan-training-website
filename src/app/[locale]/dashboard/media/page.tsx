import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { MediaGrid, type MediaItem } from "./media-grid";

export const metadata = { title: "Media" };

export default async function MediaDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const media = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    include: { translations: true },
  });

  const items: MediaItem[] = media.map((m) => ({
    id: m.id,
    url: m.url,
    originalName: m.originalName,
    mimeType: m.mimeType,
    size: m.size,
    createdAt: m.createdAt,
    translations: m.translations.map((t) => ({
      locale: t.locale,
      title: t.title,
      altText: t.altText,
      description: t.description,
    })),
  }));

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Media Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload, organize, and edit media assets used across pages, posts, and events.
        </p>
      </div>
      <MediaGrid locale={activeLocale} media={items} />
    </section>
  );
}
