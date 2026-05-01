"use client";

/**
 * Route-aware shell wrapper.
 *
 * Auth and dashboard screens intentionally render without global site chrome.
 */
import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/layout/footer";
import { SiteNav, type NavMenuItem } from "@/components/layout/nav";

export function LocaleShell({
  children,
  locale,
  menuItems,
}: {
  children: React.ReactNode;
  locale: "ar" | "en";
  menuItems?: NavMenuItem[];
}) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith(`/${locale}/auth`);
  const isDashboardRoute = pathname?.startsWith(`/${locale}/dashboard`);

  if (isAuthRoute || isDashboardRoute) {
    return <>{children}</>;
  }

  return (
    <div className="frontend-shell bg-background text-on-surface">
      <SiteNav locale={locale} menuItems={menuItems} />
      <div className="">{children}</div>
      <SiteFooter locale={locale} />
    </div>
  );
}
