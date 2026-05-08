"use client";

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
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const links = [
  { icon: DashboardSquare01Icon, label: "Overview", segment: "" },
  { icon: Calendar03Icon, label: "Programs", segment: "programs" },
  { icon: NewsIcon, label: "Blog", segment: "blog" },
  { icon: Mail01Icon, label: "Registrations", segment: "registrations" },
  { icon: FolderLibraryIcon, label: "Pages", segment: "pages" },
  { icon: Menu01Icon, label: "Menus", segment: "menus" },
  { icon: Image01Icon, label: "Media", segment: "media" },
  { icon: Tag01Icon, label: "Categories", segment: "categories" },
  { icon: UserGroupIcon, label: "Trainers", segment: "trainers" },
  { icon: UserGroupIcon, label: "Users", segment: "users" },
  { icon: Settings01Icon, label: "Settings", segment: "settings" },
] as const;

export function AdminSidebar({
  locale,
  user,
}: {
  locale: "ar" | "en";
  user: { name: string; email: string | null };
}) {
  const pathname = usePathname();

  return (
    <Sidebar className="text-sidebar-foreground" collapsible="icon">
      <SidebarHeader className="bg-[#001919]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-auto py-3 px-4"
              render={<Link href="/" />}
              size="lg"
              tooltip="Kayan"
            >
              <Image
                alt="Kayan"
                className="h-8 w-auto group-data-[collapsible=icon]:hidden"
                height={32}
                src="/brand/kayan-logo.svg"
                width={100}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {links.map((link) => {
            const href = link.segment
              ? `/${locale}/dashboard/${link.segment}`
              : `/${locale}/dashboard`;
            const active =
              pathname === href ||
              (!!link.segment && !!pathname?.startsWith(href));
            return (
              <SidebarMenuItem key={link.segment || "overview"}>
                <SidebarMenuButton
                  className="text-sidebar-foreground hover:text-sidebar-accent-foreground"
                  isActive={active}
                  render={<Link href={href} />}
                >
                  <HugeiconsIcon icon={link.icon} size={17} strokeWidth={1.8} />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {user?.name}
            </p>
            <p className="truncate text-xs text-sidebar-foreground">
              {user?.email}
            </p>
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
