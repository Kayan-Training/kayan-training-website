"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { useSession } from "@/lib/auth-client";

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/ar" || href === "/en") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({ locale }: { locale: "ar" | "en" }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: `/${locale}`, labelAr: "الرئيسية", labelEn: "Home" },
    { href: `/${locale}/events`, labelAr: "الفعاليات", labelEn: "Events" },
    { href: `/${locale}/posts`, labelAr: "المقالات", labelEn: "Posts" },
    { href: `/${locale}/services`, labelAr: "خدماتنا", labelEn: "Services" },
    { href: `/${locale}/knowledge`, labelAr: "المعرفة", labelEn: "Knowledge" },
    { href: `/${locale}/about`, labelAr: "عن كيان", labelEn: "About" },
  ];

  return (
    <nav className="glass-nav fixed top-0 z-50 w-full border-b border-white/[0.06]">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-6 md:px-10">
        <Link aria-label="Kayan Home" className="flex items-center shrink-0" href={`/${locale}`}>
          <Image alt="Kayan" className="h-10 w-auto" height={40} priority src="/brand/kayan-logo.svg" width={160} />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                className={`border-b pb-0.5 text-[13px] tracking-wide transition-colors ${active ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}
                href={link.href}
                key={link.href}
              >
                {locale === "ar" ? link.labelAr : link.labelEn}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <LocaleSwitcher locale={locale} />
          {session?.user ? (
            <Link className="ghost-border hidden h-9 items-center gap-1.5 px-3 text-[12px] text-on-surface-variant transition-colors hover:text-on-surface md:flex" href={`/${locale}/dashboard`}>
              <HugeiconsIcon icon={UserIcon} size={14} strokeWidth={2} />
              <span>{locale === "ar" ? "لوحة التحكم" : "Dashboard"}</span>
            </Link>
          ) : (
            <Link className="ghost-border hidden h-9 items-center gap-1.5 px-3 text-[12px] text-on-surface-variant transition-colors hover:text-on-surface md:flex" href={`/${locale}/auth`}>
              <HugeiconsIcon icon={UserIcon} size={14} strokeWidth={2} />
              <span>{locale === "ar" ? "دخول" : "Login"}</span>
            </Link>
          )}
          <Link className="hidden h-9 items-center bg-primary-container px-5 text-[12px] font-semibold uppercase tracking-widest text-on-primary-container transition-all hover:bg-secondary hover:text-surface-dim sm:flex" href={`/${locale}/events`}>
            {locale === "ar" ? "الفعاليات" : "View Events"}
          </Link>
          <button className="ghost-border flex h-9 w-9 items-center justify-center text-on-surface-variant transition-colors hover:text-on-surface lg:hidden" type="button" aria-label="Open menu" onClick={() => setMobileOpen((v) => !v)}>
            <HugeiconsIcon icon={Menu01Icon} size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className={`${mobileOpen ? "max-h-[520px]" : "max-h-0"} overflow-hidden border-t border-white/[0.06] bg-surface-container-lowest transition-all duration-300 lg:hidden`}>
        <div className="space-y-1 px-6 py-6">
          {links.map((link) => (
            <Link
              className={`block border-b border-outline-variant/30 py-3 text-sm ${isActive(pathname, link.href) ? "text-primary" : "text-on-surface-variant"}`}
              href={link.href}
              key={`m-${link.href}`}
              onClick={() => setMobileOpen(false)}
            >
              {locale === "ar" ? link.labelAr : link.labelEn}
            </Link>
          ))}
          {session?.user ? (
            <Link className="mt-4 block border border-outline-variant px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-on-surface" href={`/${locale}/dashboard`} onClick={() => setMobileOpen(false)}>
              {locale === "ar" ? "لوحة التحكم" : "Dashboard"}
            </Link>
          ) : (
            <Link className="mt-4 block border border-outline-variant px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-on-surface" href={`/${locale}/auth`} onClick={() => setMobileOpen(false)}>
              {locale === "ar" ? "دخول / تسجيل" : "Login / Register"}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
