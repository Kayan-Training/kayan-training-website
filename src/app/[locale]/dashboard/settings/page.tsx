import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

export default async function SettingsDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const settings = await db.setting.findMany({
    orderBy: { key: "asc" },
  });

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">{activeLocale === "ar" ? "الإعدادات" : "Settings"}</h1>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Key</th>
              <th className="px-4 py-3 text-left">Updated</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((item) => (
              <tr className="border-t border-border/60" key={item.key}>
                <td className="px-4 py-3 font-mono text-xs">{item.key}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Intl.DateTimeFormat(activeLocale === "ar" ? "ar-OM" : "en-GB", { dateStyle: "medium" }).format(item.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
