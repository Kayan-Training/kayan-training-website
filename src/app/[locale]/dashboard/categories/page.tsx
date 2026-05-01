import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { CategoriesManager, type CategoryItem } from "./categories-manager";

export default async function CategoriesDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const raw = await db.category.findMany({
    include: { translations: true },
    orderBy: { slug: "asc" },
  });

  const categories: CategoryItem[] = raw.map((c) => ({
    id: c.id,
    slug: c.slug,
    icon: c.icon,
    color: c.color,
    nameEn: c.translations.find((t) => t.locale === "en")?.name ?? c.slug,
    nameAr: c.translations.find((t) => t.locale === "ar")?.name ?? c.slug,
  }));

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">Categories</h1>
      </div>
      <CategoriesManager categories={categories} locale={activeLocale} />
    </section>
  );
}
