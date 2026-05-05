import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { isSupportedLocale } from "@/lib/i18n/config";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | Dashboard" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const session = await getServerSession();

  if (!session) {
    redirect(`/${activeLocale}/auth`);
  }

  if (session.user.role !== "admin") {
    redirect(`/${activeLocale}/events`);
  }

  return (
    <div className="dashboard-theme">
      <SidebarProvider>
        <AdminSidebar locale={activeLocale} user={session.user} />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-background/80 backdrop-blur-sm px-4">
            <SidebarTrigger className="-ml-1 text-primary-foreground cursor-pointer" />
            <Separator
              className="mr-2 data-[orientation=vertical]:h-4"
              orientation="vertical"
            />
            <span className="text-sm font-medium text-muted-foreground">
              Dashboard
            </span>
          </header>
          <main className="min-h-screen p-6">
            <div className="mx-auto w-full  text-primary-foreground">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
