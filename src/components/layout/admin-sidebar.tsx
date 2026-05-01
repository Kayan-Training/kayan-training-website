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
import { cn } from "@/lib/utils";

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

export function AdminSidebar({ locale }: { locale: "ar" | "en" }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-e border-border/60 bg-sidebar p-5 text-sidebar-foreground">
      <div className="mb-8">
        <Link href={`/${locale}/dashboard`}>
          <Image alt="Kayan" className="h-10 w-auto" height={40} src="/brand/kayan-logo.svg" width={120} />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 text-sm">
        {links.map((link) => {
          const href = link.segment ? `/${locale}/dashboard/${link.segment}` : `/${locale}/dashboard`;
          const active = pathname === href || (link.segment && pathname?.startsWith(href));
          return (
            <Link
              key={link.segment || "overview"}
              href={href}
              className={cn(
                "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <HugeiconsIcon icon={link.icon} size={17} strokeWidth={1.8} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border pt-4 text-xs text-sidebar-foreground/70">
        Kayan Admin
      </div>
    </aside>
  );
}
