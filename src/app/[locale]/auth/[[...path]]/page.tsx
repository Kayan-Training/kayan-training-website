import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AuthPanel } from "@/components/auth/auth-panel";
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default async function AuthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const session = await getServerSession();

  if (session?.user) {
    redirect(session.user.role === "admin" ? `/${activeLocale}/dashboard` : `/${activeLocale}/events`);
  }

  const authSettingKeys = [
    "auth.side.imageUrl",
    "auth.side.heading.ar",
    "auth.side.heading.en",
    "auth.side.description.ar",
    "auth.side.description.en",
  ];
  const authSettings = await db.setting.findMany({
    where: { key: { in: authSettingKeys } },
  });
  const authSettingMap = new Map(
    authSettings.map((s) => [s.key, typeof s.value === "string" ? s.value : ""]),
  );
  const sideImage =
    authSettingMap.get("auth.side.imageUrl")?.trim() ||
    "https://images.unsplash.com/photo-1756840210349-7bc0ae472ef8?w=900&q=80";
  const sideHeading =
    (activeLocale === "ar"
      ? authSettingMap.get("auth.side.heading.ar")
      : authSettingMap.get("auth.side.heading.en"))?.trim() ||
    (activeLocale === "ar" ? "بوابتك نحو التطوير المهني" : "Your Gateway to Professional Growth");
  const sideDescription =
    (activeLocale === "ar"
      ? authSettingMap.get("auth.side.description.ar")
      : authSettingMap.get("auth.side.description.en"))?.trim() ||
    (activeLocale === "ar"
      ? "سجّل دخولك لتتابع فعالياتك المسجلة، وتصفح البرامج الجديدة، وتدير ملفك الشخصي."
      : "Log in to track your registered events, browse new programs, and manage your profile.");

  return (
    <main className="grid min-h-screen grid-cols-1 bg-background text-on-surface lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-surface-container-lowest p-12 lg:flex">
        <div className="absolute inset-0">
          <Image
            alt=""
            className="object-cover opacity-20 grayscale"
            fill
            priority
            sizes="50vw"
            src={sideImage}
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(13,15,15,0.98)_0%,rgba(23,67,78,0.7)_100%)]" />
        </div>

        <div className="relative z-10">
          <Link href={`/${activeLocale}`}>
            <Image alt="Kayan" className="h-9 w-auto" height={36} src="/brand/kayan-logo.svg" width={140} />
          </Link>
        </div>

        <div className="relative z-10">
          <div className="vertical-track mb-8 h-16 opacity-60" />
          <h1 className="text-glow mb-6 text-4xl font-semibold leading-tight">{sideHeading}</h1>
          <p className="max-w-sm text-sm leading-relaxed text-on-surface-variant">
            {sideDescription}
          </p>
        </div>

        <div className="glass-panel ghost-border relative z-10 p-6">
          <p className="mb-4 text-sm italic leading-relaxed text-on-surface-variant">
            {activeLocale === "ar"
              ? "الدورات التي حضرتها عبر كيان غيّرت مسيرتي المهنية تماماً."
              : "The courses I attended through Kayan completely transformed my career."}
          </p>
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden">
              <Image alt="" className="object-cover grayscale" fill sizes="32px" src="https://images.unsplash.com/photo-1573165231977-3f0e27806045?w=100&q=80" />
            </div>
            <div>
              <div className="text-xs font-semibold">{activeLocale === "ar" ? "أ. سارة المعمري" : "Sarah Al-Maamari"}</div>
              <div className="text-[10px] text-on-surface-variant">{activeLocale === "ar" ? "مديرة موارد بشرية" : "HR Manager"}</div>
            </div>
          </div>
        </div>
      </section>
      <section className="flex min-h-screen flex-col justify-center px-6 py-16 md:px-12">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="mb-10 lg:hidden">
            <Link href={`/${activeLocale}`}>
              <Image alt="Kayan" className="h-9 w-auto" height={36} src="/brand/kayan-logo.svg" width={140} />
            </Link>
          </div>
          <AuthPanel locale={activeLocale} />
        </div>
      </section>
    </main>
  );
}
