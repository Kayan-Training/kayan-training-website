import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

export default async function DashboardPageEditor({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const page = await db.page.findFirst({
    where: { slug },
    include: { translations: true },
  });

  if (!page) notFound();

  const translation = page.translations.find((item) => item.locale === activeLocale) ?? page.translations[0];

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">{translation?.title ?? page.slug}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{page.slug}</p>
      </div>
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <p className="text-sm text-muted-foreground">
          {activeLocale === "ar"
            ? "تحرير الصفحات سيُستكمل في خطوة إعادة البناء التالية."
            : "Page editing will be completed in the next rebuild step."}
        </p>
      </div>
    </section>
  );
}
