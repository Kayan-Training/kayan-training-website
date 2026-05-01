import Image from "next/image";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

export default async function MediaDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const media = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">{activeLocale === "ar" ? "الوسائط" : "Media Library"}</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {media.map((item) => (
          <article className="overflow-hidden rounded-lg border border-border/70 bg-card" key={item.id}>
            <div className="relative aspect-[4/3] bg-muted">
              <Image alt={item.originalName} className="object-cover" fill sizes="240px" src={item.url} />
            </div>
            <div className="p-2">
              <p className="line-clamp-1 text-xs font-medium">{item.originalName}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
