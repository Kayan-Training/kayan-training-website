import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { CategoriesManager, type CategoryItem } from "./categories-manager";

export const metadata = { title: "Categories" };

function normalizeOrderedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const deduped = new Set<string>();
  for (const id of value) {
    if (typeof id === "string" && id.length > 0) {
      deduped.add(id);
    }
  }
  return Array.from(deduped);
}

export default async function CategoriesDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const [raw, orderSetting] = await Promise.all([
    db.category.findMany({
      include: { translations: true },
      orderBy: { slug: "asc" },
    }),
    db.setting.findUnique({ where: { key: "categories.order" } }),
  ]);
  const orderedRaw = (() => {
    const orderedIds = normalizeOrderedIds(orderSetting?.value);
    if (orderedIds.length === 0) return raw;
    const byId = new Map(raw.map((c) => [c.id, c]));
    const head = orderedIds.map((id) => byId.get(id)).filter((c): c is (typeof raw)[number] => Boolean(c));
    const tail = raw.filter((c) => !orderedIds.includes(c.id));
    return [...head, ...tail];
  })();

  const categories: CategoryItem[] = orderedRaw.map((c) => ({
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
