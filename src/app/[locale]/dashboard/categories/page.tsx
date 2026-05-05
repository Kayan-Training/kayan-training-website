import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { CategoriesManager, type CategoryItem } from "./categories-manager";

export const metadata = { title: "Categories" };

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
    image: c.image ?? "",
    nameEn: c.translations.find((t) => t.locale === "en")?.name ?? c.slug,
    nameAr: c.translations.find((t) => t.locale === "ar")?.name ?? c.slug,
    descEn: c.translations.find((t) => t.locale === "en")?.description ?? "",
    descAr: c.translations.find((t) => t.locale === "ar")?.description ?? "",
  }));

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage taxonomy groups used for event and content organization.
        </p>
      </div>
      <CategoriesManager categories={categories} locale={activeLocale} />
    </section>
  );
}
