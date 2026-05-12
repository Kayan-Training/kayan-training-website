import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import type { LinkPickerEntities } from "@/components/ui/link-picker-input";
import { TrainersManager, type TrainerItem } from "./trainers-manager";

export const metadata = { title: "Trainers" };

export default async function TrainersDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const [trainers, pages, posts, events] = await Promise.all([
    db.trainer.findMany({
      include: { translations: true, avatar: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    db.page.findMany({
      include: { translations: { where: { locale: activeLocale }, take: 1 } },
      orderBy: { slug: "asc" },
    }),
    db.post.findMany({
      where: { status: "published" },
      include: { translations: { where: { locale: activeLocale }, take: 1 } },
      orderBy: { publishedAt: "desc" },
    }),
    db.event.findMany({
      where: { status: "published" },
      include: { translations: { where: { locale: activeLocale }, take: 1 } },
      orderBy: { startDate: "desc" },
    }),
  ]);

  const items: TrainerItem[] = trainers.map((trainer, index) => ({
    id: trainer.id,
    email: trainer.email ?? "",
    nameEn: trainer.translations.find((t) => t.locale === "en")?.name ?? trainer.name ?? "",
    nameAr: trainer.translations.find((t) => t.locale === "ar")?.name ?? trainer.name ?? "",
    specializationEn: trainer.translations.find((t) => t.locale === "en")?.title ?? trainer.specialization ?? "",
    specializationAr: trainer.translations.find((t) => t.locale === "ar")?.title ?? "",
    bioEn: trainer.translations.find((t) => t.locale === "en")?.bio ?? "",
    bioAr: trainer.translations.find((t) => t.locale === "ar")?.bio ?? "",
    imageUrl: trainer.imageUrl ?? trainer.avatar?.url ?? "",
    links: Array.isArray(trainer.links)
      ? trainer.links.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [],
    sortOrder: trainer.sortOrder ?? index,
  }));

  const entities: LinkPickerEntities = {
    pages: pages.map((p) => ({
      id: p.id,
      label: p.translations[0]?.title ?? p.slug,
      url: `/${activeLocale}/${p.slug}`,
    })),
    posts: posts.map((p) => ({
      id: p.id,
      label: p.translations[0]?.title ?? p.slug,
      url: `/${activeLocale}/blog/${p.slug}`,
    })),
    events: events.map((e) => ({
      id: e.id,
      label: e.translations[0]?.title ?? e.slug,
      url:
        (e as { eventKind?: string }).eventKind === "training_course"
          ? `/${activeLocale}/training-courses/${e.slug}`
          : `/${activeLocale}/events/${e.slug}`,
    })),
    staticRoutes: [
      { id: "static-blog", label: activeLocale === "ar" ? "المدونة" : "Blog", url: `/${activeLocale}/blog` },
      { id: "static-events", label: activeLocale === "ar" ? "الفعاليات" : "Events", url: `/${activeLocale}/events` },
      { id: "static-training-courses", label: activeLocale === "ar" ? "الدورات التدريبية" : "Training Courses", url: `/${activeLocale}/training-courses` },
      { id: "static-contact-us", label: activeLocale === "ar" ? "تواصل معنا" : "Contact Us", url: `/${activeLocale}/contact-us` },
    ].filter((route) => !pages.some((page) => `/${activeLocale}/${page.slug}` === route.url)),
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Trainers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage trainer profiles used across programs, speakers, and agenda sessions.
        </p>
      </div>
      <TrainersManager entities={entities} locale={activeLocale} trainers={items} />
    </section>
  );
}
