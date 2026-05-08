import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

import { HeaderCtaSettings } from "./header-cta-settings";
import { MenuItemList, type EntityOption, type MenuItemRow } from "./menu-item-list";

export const metadata = { title: "Menus" };

export default async function MenusDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const [menus, pages, posts, events, ctaSettings] = await Promise.all([
    db.menu.findMany({
      include: {
        items: { include: { translations: true }, orderBy: { order: "asc" } },
      },
      orderBy: { location: "asc" },
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
    db.setting.findMany({
      where: { key: { in: ["header.cta.label.en", "header.cta.label.ar", "header.cta.url"] } },
    }),
  ]);
  const ctaMap = new Map(
    ctaSettings.map((setting) => [setting.key, typeof setting.value === "string" ? setting.value : ""]),
  );
  const initialHeaderCta = {
    labelEn: ctaMap.get("header.cta.label.en")?.trim() || "View Events",
    labelAr: ctaMap.get("header.cta.label.ar")?.trim() || "الفعاليات",
    url: ctaMap.get("header.cta.url")?.trim() || `/${activeLocale}/events`,
  };

  const entityPages: EntityOption[] = pages.map((p) => ({
    id: p.id,
    label: p.translations[0]?.title ?? p.slug,
    url: `/${activeLocale}/${p.slug}`,
  }));

  const entityPosts: EntityOption[] = posts.map((p) => ({
    id: p.id,
    label: p.translations[0]?.title ?? p.slug,
    url: `/${activeLocale}/blog/${p.slug}`,
  }));

  const entityEvents: EntityOption[] = events.map((e) => ({
    id: e.id,
    label: e.translations[0]?.title ?? e.slug,
    url:
      (e as { eventKind?: string }).eventKind === "training_course"
        ? `/${activeLocale}/training-courses/${e.slug}`
        : `/${activeLocale}/events/${e.slug}`,
  }));
  const entityTrainingCourses: EntityOption[] = events
    .filter((e) => (e as { eventKind?: string }).eventKind === "training_course")
    .map((e) => ({
    id: e.id,
    label: e.translations[0]?.title ?? e.slug,
    url: `/${activeLocale}/training-courses/${e.slug}`,
  }));

  const entities = {
    pages: entityPages,
    posts: entityPosts,
    events: entityEvents,
    trainingCourses: entityTrainingCourses,
    staticRoutes: [
      { id: "static-blog", label: activeLocale === "ar" ? "المدونة" : "Blog", url: `/${activeLocale}/blog` },
      { id: "static-events", label: activeLocale === "ar" ? "الفعاليات" : "Events", url: `/${activeLocale}/events` },
      { id: "static-training-courses", label: activeLocale === "ar" ? "الدورات التدريبية" : "Training Courses", url: `/${activeLocale}/training-courses` },
    ].filter((route) => !pages.some((page) => `/${activeLocale}/${page.slug}` === route.url)),
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Menus</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage navigation menus. Link to pages, blog posts, events, or custom URLs.
          </p>
        </div>
      </div>
      <HeaderCtaSettings entities={entities} initialValue={initialHeaderCta} locale={activeLocale} />

      {menus.length === 0 ? (
        <div className="rounded-xl border border-border/70 bg-card px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">No menus configured.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Run{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
              npx prisma db seed
            </code>{" "}
            to create the default header and footer menus.
          </p>
        </div>
      ) : (
        menus.map((menu) => {
          const items: MenuItemRow[] = menu.items.map((item) => ({
            id: item.id,
            type: item.type,
            url: item.url,
            targetId: item.targetId,
            labelEn: item.translations.find((t) => t.locale === "en")?.label ?? "",
            labelAr: item.translations.find((t) => t.locale === "ar")?.label ?? "",
            order: item.order,
          }));
          return (
            <div key={menu.id}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {menu.location}
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              <MenuItemList
                entities={entities}
                items={items}
                locale={activeLocale}
                menuId={menu.id}
              />
            </div>
          );
        })
      )}
    </section>
  );
}
