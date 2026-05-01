import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

export default async function CategoriesDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const categories = await db.category.findMany({
    include: { translations: true },
    orderBy: { slug: "asc" },
  });

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">{activeLocale === "ar" ? "التصنيفات" : "Categories"}</h1>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const label = category.translations.find((item) => item.locale === activeLocale)?.name ?? category.slug;
          return (
            <article className="rounded-lg border border-border/70 bg-card p-4" key={category.id}>
              <h2 className="text-sm font-semibold">{label}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{category.slug}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
