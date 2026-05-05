import { AlertCircleIcon } from "lucide-react";
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { isSystemPage, SYSTEM_PAGE_SLUGS } from "@/lib/pages/block-types";
import { createPageAction, deletePageAction } from "./_actions";
import { NewPageDialog } from "./_components/new-page-dialog";
import { PagesTable, type PageRow } from "./pages-table";

export const metadata = { title: "Pages" };

export default async function PagesDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const pages = await db.page.findMany({
    include: { translations: true },
    orderBy: { slug: "asc" },
  });

  const systemPages = pages.filter((p) => isSystemPage(p.slug));
  const missingSystemSlugs = SYSTEM_PAGE_SLUGS.filter(
    (slug) => !systemPages.some((p) => p.slug === slug),
  );

  const onCreatePage = createPageAction.bind(null, activeLocale);
  const onDeletePage = deletePageAction.bind(null, activeLocale);

  const rows: PageRow[] = pages.map((page) => {
    const trEn = page.translations.find((t) => t.locale === "en");
    const trAr = page.translations.find((t) => t.locale === "ar");
    return {
      id: page.id,
      kind: isSystemPage(page.slug) ? "system" : "custom",
      slug: page.slug,
      status: page.status,
      titleAr: trAr?.title ?? "",
      titleEn: trEn?.title ?? page.slug,
    };
  });

  return (
    <section className="space-y-5 mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage system pages and create custom pages.
          </p>
        </div>
        <NewPageDialog createAction={onCreatePage} />
      </div>

      {/* Missing pages warning */}
      {missingSystemSlugs.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-5 py-4">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-700">
              System pages not seeded
            </p>
            <p className="mt-0.5 text-xs text-yellow-600">
              Run{" "}
              <code className="rounded bg-yellow-100 px-1 py-0.5 font-mono text-[11px]">
                npx prisma db seed
              </code>{" "}
              to create:{" "}
              <span className="font-mono">{missingSystemSlugs.join(", ")}</span>
            </p>
          </div>
        </div>
      )}

      <PagesTable deleteAction={onDeletePage} locale={activeLocale} pages={rows} />
    </section>
  );
}
