/**
 * Locale-aware request proxy for Next.js 16 App Router.
 *
 * Responsibilities:
 * - Redirect bare `/` requests to default locale (`/ar`)
 * - Prefix non-localized routes with detected locale
 * - Persist locale preference via cookie-aware detection order
 */
import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  SUPPORTED_LOCALES,
  isSupportedLocale,
} from "@/lib/i18n/config";

function detectLocaleFromAcceptLanguage(headerValue: string | null): (typeof SUPPORTED_LOCALES)[number] {
  if (!headerValue) {
    return DEFAULT_LOCALE;
  }

  const languageTags = headerValue
    .split(",")
    .map((token) => token.trim().split(";")[0]?.toLowerCase())
    .filter((token): token is string => Boolean(token));

  for (const tag of languageTags) {
    const base = tag.split("-")[0];
    if (base && isSupportedLocale(base)) {
      return base;
    }
  }

  return DEFAULT_LOCALE;
}

function getPreferredLocale(request: NextRequest): (typeof SUPPORTED_LOCALES)[number] {
  const pathnameLocale = request.nextUrl.pathname.split("/")[1];
  if (isSupportedLocale(pathnameLocale)) {
    return pathnameLocale;
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE_KEY)?.value;
  if (cookieLocale && isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  return detectLocaleFromAcceptLanguage(request.headers.get("accept-language"));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Force all dashboard routes to English locale, regardless of active locale.
  const localizedDashboardMatch = pathname.match(/^\/(ar|en)\/dashboard(\/.*)?$/);
  if (localizedDashboardMatch && localizedDashboardMatch[1] !== "en") {
    const url = request.nextUrl.clone();
    url.pathname = `/en/dashboard${localizedDashboardMatch[2] ?? ""}`;
    return NextResponse.redirect(url);
  }

  const hasLocalePrefix = SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  const localeFromPath = hasLocalePrefix ? pathname.split("/")[1] : null;
  const resolvedLocale = (localeFromPath && isSupportedLocale(localeFromPath))
    ? localeFromPath
    : getPreferredLocale(request);

  // Maintenance mode check — skip dashboard, auth, and maintenance routes
  const isDashboard = /^\/(ar|en)\/dashboard(\/|$)/.test(pathname);
  const isMaintenancePage = /^\/(ar|en)\/maintenance$/.test(pathname);
  const isLocalizedAuthPage = /^\/(ar|en)\/auth(\/|$)/.test(pathname);
  const isBareAuthPage = /^\/auth(\/|$)/.test(pathname);
  const isAuthPage = isLocalizedAuthPage || isBareAuthPage;

  if (!isDashboard && !isMaintenancePage && !isAuthPage) {
    try {
      const res = await fetch(new URL("/api/maintenance-status", request.url));
      if (res.ok) {
        const data = (await res.json()) as { maintenance: boolean };
        if (data.maintenance) {
          const accessRes = await fetch(new URL("/api/maintenance-access", request.url), {
            headers: { cookie: request.headers.get("cookie") ?? "" },
          });
          const accessData = accessRes.ok
            ? (await accessRes.json()) as { canAccessFrontend: boolean }
            : { canAccessFrontend: false };
          if (!accessData.canAccessFrontend) {
            return NextResponse.redirect(new URL(`/${resolvedLocale}/maintenance`, request.url));
          }
        }
      }
    } catch {
      // Maintenance check failed — let request through
    }
  }

  if (!hasLocalePrefix) {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
      const url = request.nextUrl.clone();
      url.pathname = `/en${pathname}`;
      return NextResponse.redirect(url);
    }

    const url = request.nextUrl.clone();
    url.pathname = `/${resolvedLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  if (isSupportedLocale(localeFromPath!)) {
    response.cookies.set(LOCALE_COOKIE_KEY, localeFromPath!, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });

    const hasSessionCookie =
      Boolean(request.cookies.get("better-auth.session_token")?.value) ||
      Boolean(request.cookies.get("__Secure-better-auth.session_token")?.value);

    if (isDashboard && !hasSessionCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${localeFromPath}/auth`;
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
