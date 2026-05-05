"use client";

/**
 * Shared dashboard shell built with shadcn sidebar primitives.
 *
 * Mirrors the structural rhythm used in Safety Hero:
 * - inset sidebar layout
 * - sticky top header
 * - compact nav list with active states
 */
import {
  Bookmark01Icon,
  Calendar03Icon,
  ChartRingIcon,
  DashboardSquare01Icon,
  File01Icon,
  Image02Icon,
  Layers01Icon,
  Menu11Icon,
  Settings01Icon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const items = [
  {
    href: "/dashboard",
    icon: DashboardSquare01Icon,
    key: "overview",
    label: { ar: "لوحة التحكم", en: "Overview" },
  },
  {
    href: "/dashboard/events",
    icon: Calendar03Icon,
    key: "events",
    label: { ar: "الفعاليات", en: "Events" },
  },
  {
    href: "/dashboard/posts",
    icon: File01Icon,
    key: "posts",
    label: { ar: "المحتوى", en: "Posts" },
  },
  {
    href: "/dashboard/registrations",
    icon: ChartRingIcon,
    key: "registrations",
    label: { ar: "التسجيلات", en: "Registrations" },
  },
  {
    href: "/dashboard/categories",
    icon: Layers01Icon,
    key: "categories",
    label: { ar: "التصنيفات", en: "Categories" },
  },
  {
    href: "/dashboard/menus",
    icon: Menu11Icon,
    key: "menus",
    label: { ar: "القوائم", en: "Menus" },
  },
  {
    href: "/dashboard/media",
    icon: Image02Icon,
    key: "media",
    label: { ar: "الوسائط", en: "Media" },
  },
  {
    href: "/dashboard/pages/home",
    icon: Bookmark01Icon,
    key: "pages",
    label: { ar: "الصفحات", en: "Pages" },
  },
  {
    href: "/dashboard/users",
    icon: UserGroup03Icon,
    key: "users",
    label: { ar: "المستخدمون", en: "Users" },
  },
  {
    href: "/dashboard/settings",
    icon: Settings01Icon,
    key: "settings",
    label: { ar: "الإعدادات", en: "Settings" },
  },
] as const;

function resolveTitle(pathname: string, locale: "ar" | "en") {
  const candidate = items
    .filter((item) => pathname.includes(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    candidate?.label[locale] ?? (locale === "ar" ? "لوحة التحكم" : "Dashboard")
  );
}

export function DashboardShell({
  children,
  locale,
  userName,
  userRole,
}: {
  children: React.ReactNode;
  locale: "ar" | "en";
  userName?: string | null;
  userRole?: string | null;
}) {
  const pathname = usePathname();
  const title = resolveTitle(pathname, locale);

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="icon"
        side={locale === "ar" ? "right" : "left"}
        variant="inset"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href={`/${locale}`} />}
                size="lg"
                tooltip="Kayan"
              >
                <span>
                  <Image
                    alt="Kayan"
                    className="h-8 w-auto"
                    height={32}
                    src="/brand/kayan-logo.svg"
                    width={96}
                  />
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarMenu className="gap-1">
            {items.map((item) => {
              const active =
                pathname === `/${locale}${item.href}` ||
                pathname.startsWith(`/${locale}${item.href}/`);

              return (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    className={cn(
                      active &&
                        "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                    isActive={active}
                    render={<Link href={`/${locale}${item.href}`} />}
                    tooltip={item.label[locale]}
                  >
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                    <span>{item.label[locale]}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarSeparator />
        <SidebarFooter>
          <div className="rounded-md border border-border/60 bg-card px-3 py-2 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">
              {userName ?? (locale === "ar" ? "مدير النظام" : "Admin User")}
            </div>
            <div>{userRole ?? "admin"}</div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-background/95 px-4 text-foreground backdrop-blur-xl">
          <SidebarTrigger />
          <Separator className="hidden h-6 md:block" orientation="vertical" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex-1 bg-background p-4 text-foreground md:p-none">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
