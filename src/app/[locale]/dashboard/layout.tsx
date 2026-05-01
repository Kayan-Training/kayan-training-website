import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
    <div className="dashboard-theme">
      <SidebarProvider>
        <AdminSidebar locale={activeLocale} userEmail={session.user.email} />
        <SidebarInset>
          <main className="min-h-screen p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
