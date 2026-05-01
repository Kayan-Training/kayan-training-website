import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { MenuItemList, type MenuItemRow } from "./menu-item-list";

export default async function MenusDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const menus = await db.menu.findMany({
    include: {
      items: {
        include: { translations: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { location: "asc" },
  });

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">Menus</h1>
      </div>
      {menus.map((menu) => {
        const items: MenuItemRow[] = menu.items.map((item) => ({
          id: item.id,
          url: item.url,
          labelEn: item.translations.find((t) => t.locale === "en")?.label ?? "",
          labelAr: item.translations.find((t) => t.locale === "ar")?.label ?? "",
          order: item.order,
        }));
        return (
          <div key={menu.id}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {menu.location}
            </h2>
            <MenuItemList items={items} locale={activeLocale} menuId={menu.id} />
          </div>
        );
      })}
    </section>
  );
}
