import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { isSupportedLocale } from "@/lib/i18n/config";
import { requireAdminSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const session = await requireAdminSession();

  if (!session) {
    redirect(`/${activeLocale}/auth`);
  }

  return (
    <div className="dashboard-theme flex min-h-screen bg-background text-foreground">
      <AdminSidebar locale={activeLocale} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
