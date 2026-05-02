import { LinkSquare02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, GlobeIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { isSystemPage, SYSTEM_PAGE_SLUGS } from "@/lib/pages/block-types";
import { cn } from "@/lib/utils";
import { createPageAction } from "./_actions";
import { NewPageDialog } from "./_components/new-page-dialog";

export const metadata = { title: "Pages" };

function statusTone(status: string) {
  if (status === "published")
    return "border-green-500/40 bg-green-500/10 text-green-600";
  if (status === "draft")
    return "border-yellow-500/40 bg-yellow-500/10 text-yellow-600";
  return "border-border bg-muted text-muted-foreground";
}

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
  const userPages = pages.filter((p) => !isSystemPage(p.slug));

  const missingSystemSlugs = SYSTEM_PAGE_SLUGS.filter(
    (slug) => !systemPages.some((p) => p.slug === slug),
  );

  const onCreatePage = createPageAction.bind(null, activeLocale);

  function PageRow({ page }: { page: (typeof pages)[number] }) {
    const trEn = page.translations.find((t) => t.locale === "en");
    const trAr = page.translations.find((t) => t.locale === "ar");
    return (
      <div className="flex items-center gap-4 border-b border-border/50 px-5 py-3 last:border-0">
        <div className="min-w-0 flex-1">
          <Link
            href={`/${activeLocale}/dashboard/pages/${page.slug}`}
            className="text-sm font-semibold text-foreground hover:underline hover:text-primary"
          >
            {trEn?.title ?? page.slug}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {trAr?.title && <span>{trAr.title} · </span>}
            <span className="font-mono text-[11px]">/{page.slug}</span>
          </p>
        </div>

        <Badge
          className={cn("rounded-none uppercase", statusTone(page.status))}
          variant="outline"
        >
          {page.status}
        </Badge>

        <div className="flex items-center gap-1.5">
          <Link
            aria-label="Edit page"
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "h-8 w-8 p-0",
            )}
            href={`/${activeLocale}/dashboard/pages/${page.slug}`}
          >
            <HugeiconsIcon icon={PencilEdit02Icon} />
            <span className="sr-only">Edit Page</span>
          </Link>
          <Link
            aria-label="View page"
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "h-8 w-8 p-0",
            )}
            href={`/${activeLocale}/${page.slug}`}
            target="_blank"
          >
            <HugeiconsIcon icon={LinkSquare02Icon} />
            <span className="sr-only">View Page</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-5">
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

      {/* System pages */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="border-b border-border/50 bg-muted/20 px-5 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            System Pages
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Pre-defined site pages — edit titles, SEO, and content blocks.
          </p>
        </div>
        {systemPages.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            No system pages found. Run the database seed to create them.
          </p>
        ) : (
          systemPages.map((page) => <PageRow key={page.id} page={page} />)
        )}
      </div>

      {/* User-created pages */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="border-b border-border/50 bg-muted/20 px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Custom Pages
              </h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Pages created manually — accessible at /[locale]/[slug].
              </p>
            </div>
            {userPages.length > 0 && (
              <Badge
                className="border-border bg-muted text-muted-foreground"
                variant="outline"
              >
                {userPages.length}
              </Badge>
            )}
          </div>
        </div>
        {userPages.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No custom pages yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use the{" "}
              <span className="font-medium text-foreground">New Page</span>{" "}
              button to create one.
            </p>
          </div>
        ) : (
          userPages.map((page) => <PageRow key={page.id} page={page} />)
        )}
      </div>
    </section>
  );
}
