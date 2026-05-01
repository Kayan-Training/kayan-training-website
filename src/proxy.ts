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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const hasLocalePrefix = SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocalePrefix) {
    const localeFromPath = pathname.split("/")[1];
    const response = NextResponse.next();

    if (isSupportedLocale(localeFromPath)) {
      response.cookies.set(LOCALE_COOKIE_KEY, localeFromPath, {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        sameSite: "lax",
      });

      const isDashboard = pathname === `/${localeFromPath}/dashboard` || pathname.startsWith(`/${localeFromPath}/dashboard/`);
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

  const locale = getPreferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
