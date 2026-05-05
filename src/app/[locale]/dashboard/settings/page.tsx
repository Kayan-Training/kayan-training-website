import { db } from "@/lib/db";

import { SettingsForm } from "./_components/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const settings = await db.setting.findMany({ orderBy: { key: "asc" } });

  const initialValues: Record<string, string> = {};
  for (const s of settings) {
    initialValues[s.key] =
      typeof s.value === "string" ? s.value : JSON.stringify(s.value);
  }

  return (
    <section className="space-y-5 max-w-6xl mx-auto">
      <div className="">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure site-wide information, contact details, and social links.
        </p>
      </div>
      <SettingsForm initialValues={initialValues} locale={locale === "ar" ? "ar" : "en"} />
    </section>
  );
}
