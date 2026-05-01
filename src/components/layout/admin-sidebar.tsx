"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar03Icon,
  DashboardSquare01Icon,
  FolderLibraryIcon,
  Image01Icon,
  Mail01Icon,
  Menu01Icon,
  NewsIcon,
  Settings01Icon,
  Tag01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const links = [
  { icon: DashboardSquare01Icon, label: "Overview", segment: "" },
  { icon: Calendar03Icon, label: "Events", segment: "events" },
  { icon: NewsIcon, label: "Posts", segment: "posts" },
  { icon: Mail01Icon, label: "Registrations", segment: "registrations" },
  { icon: FolderLibraryIcon, label: "Pages", segment: "pages/events" },
  { icon: Menu01Icon, label: "Menus", segment: "menus" },
  { icon: Image01Icon, label: "Media", segment: "media" },
  { icon: Tag01Icon, label: "Categories", segment: "categories" },
  { icon: UserGroupIcon, label: "Users", segment: "users" },
  { icon: Settings01Icon, label: "Settings", segment: "settings" },
] as const;

export function AdminSidebar({
  locale,
  userEmail,
}: {
  locale: "ar" | "en";
  userEmail?: string | null;
}) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href={`/${locale}/dashboard`}>
          <Image alt="Kayan" className="h-9 w-auto" height={36} src="/brand/kayan-logo.svg" width={110} />
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {links.map((link) => {
            const href = link.segment ? `/${locale}/dashboard/${link.segment}` : `/${locale}/dashboard`;
            const active = pathname === href || (!!link.segment && !!pathname?.startsWith(href));
            return (
              <SidebarMenuItem key={link.segment || "overview"}>
                <SidebarMenuButton isActive={active} render={<Link href={href} />}>
                  <HugeiconsIcon icon={link.icon} size={17} strokeWidth={1.8} />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-sidebar-foreground">{userEmail ?? "Admin"}</p>
            <p className="text-[11px] text-sidebar-foreground/60">Administrator</p>
          </div>
          <Link
            className="shrink-0 rounded-md px-2 py-1 text-[11px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            href={`/${locale}/auth/sign-out`}
          >
            Sign out
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
