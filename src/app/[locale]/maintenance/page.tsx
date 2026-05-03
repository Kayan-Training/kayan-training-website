import { isSupportedLocale } from "@/lib/i18n/config";

export const metadata = { title: "Coming Soon" };

export default async function MaintenancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const isAr = activeLocale === "ar";

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="max-w-lg">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary">
          {isAr ? "كيان للتدريب والاستشارات" : "Kayan Training & Consulting"}
        </p>
        <h1
          className="mb-6 font-semibold leading-tight text-on-surface"
          style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}
        >
          {isAr ? "الموقع قيد الصيانة" : "Under Maintenance"}
        </h1>
        <p className="text-sm leading-relaxed text-on-surface-variant">
          {isAr
            ? "نعمل على تحسين الموقع. سنعود قريباً."
            : "We're working on improvements. We'll be back shortly."}
        </p>
      </div>
    </main>
  );
}
