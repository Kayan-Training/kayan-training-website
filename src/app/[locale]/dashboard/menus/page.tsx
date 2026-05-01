import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

export default async function MenusDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const menus = await db.menu.findMany({
    include: { items: true },
    orderBy: { location: "asc" },
  });

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">{activeLocale === "ar" ? "القوائم" : "Menus"}</h1>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {menus.map((menu) => (
          <article className="rounded-lg border border-border/70 bg-card p-4" key={menu.id}>
            <h2 className="text-sm font-semibold">{menu.location}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{menu.items.length} items</p>
          </article>
        ))}
      </div>
    </section>
  );
}
