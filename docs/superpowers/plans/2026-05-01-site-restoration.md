# Site Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the Kayan Training platform to production quality after a Codex script broke custom Tailwind classes and left dashboard pages in a minimal state.

**Architecture:** Next.js 16 App Router with `[locale]` i18n segment, Tailwind v4 `@theme` tokens, shadcn/ui, Prisma/PostgreSQL, Better Auth. Dashboard uses light theme via `.dashboard-theme` CSS class.

**Tech Stack:** Next.js 16, Tailwind v4, shadcn/ui (sidebar, alert-dialog, table, badge), Tiptap v3 (`@tiptap/starter-kit`), Prisma, Better Auth, React Hook Form + Zod, Lucide icons (dashboard), HugeIcons (public pages)

---

## File Map

| File | Change |
|------|--------|
| `src/components/events/event-card.tsx` | Fix inset-0 image layout |
| `src/app/[locale]/events/[slug]/page.tsx` | Fix rich text rendering |
| `src/components/i18n/locale-switcher.tsx` | Show language name |
| `src/components/layout/nav.tsx` | DB-driven menu with fallback |
| `prisma/schema.prisma` | Add `showMapEmbed`, `googleMapsLink` |
| `src/app/[locale]/dashboard/layout.tsx` | Wrap in SidebarProvider |
| `src/components/layout/admin-sidebar.tsx` | Refactor to shadcn Sidebar |
| `src/app/[locale]/dashboard/events/_actions.ts` | Create server actions |
| `src/app/[locale]/dashboard/events/[id]/page.tsx` | Wire EventForm |
| `src/app/[locale]/dashboard/events/new/page.tsx` | Wire EventForm |
| `src/app/[locale]/dashboard/registrations/registrations-table.tsx` | Full production table |
| `src/app/[locale]/dashboard/registrations/page.tsx` | Use new table |
| `src/app/[locale]/dashboard/registrations/[eventId]/page.tsx` | Production per-event table |
| `src/app/[locale]/dashboard/posts/posts-table.tsx` | Full production table |
| `src/app/[locale]/dashboard/posts/page.tsx` | Use new table |
| `src/app/[locale]/dashboard/posts/[id]/page.tsx` | Wire PostForm |
| `src/app/[locale]/dashboard/posts/new/page.tsx` | Wire PostForm |
| `src/app/[locale]/dashboard/categories/page.tsx` | Full CRUD |
| `src/app/[locale]/dashboard/categories/_actions.ts` | Create/delete actions |
| `src/app/[locale]/dashboard/users/users-table.tsx` | Production table |
| `src/app/[locale]/dashboard/users/page.tsx` | Use new table |
| `src/app/[locale]/dashboard/users/_actions.ts` | Role/ban actions |
| `src/app/[locale]/dashboard/media/media-grid.tsx` | Grid + delete |
| `src/app/[locale]/dashboard/media/page.tsx` | Use new grid |
| `src/app/[locale]/dashboard/media/_actions.ts` | Delete action |
| `src/app/[locale]/dashboard/menus/page.tsx` | Editable menu items |
| `src/app/[locale]/dashboard/menus/_actions.ts` | Menu CRUD actions |

---

## Task 1: Fix Event Card Image (inset-0 layout)

**Files:**
- Modify: `src/components/events/event-card.tsx`

The `h-44` wrapper breaks the full-card inset image. The `event-card` class in globals.css already sets `min-height: 340px; position: relative; overflow: hidden` — image should be `absolute inset-0` and content overlaid.

- [ ] **Step 1: Replace event-card.tsx**

```tsx
import { ArrowRight01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

export type EventCardItem = {
  coverImage: string;
  dateLabel: string;
  slug: string;
  tag: string;
  title: string;
};

export function EventCard({ event, locale }: { event: EventCardItem; locale: "ar" | "en" }) {
  return (
    <Link
      href={`/${locale}/events/${event.slug}`}
      className="event-card group relative overflow-hidden ghost-border"
    >
      <Image
        alt={event.title}
        className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
        fill
        sizes="(max-width: 1024px) 100vw, 25vw"
        src={event.coverImage}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/95 via-surface-container-lowest/60 to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-end p-5">
        <span className="badge-teal font-body mb-3 w-fit">{event.tag}</span>
        <h3 className="mb-3 line-clamp-2 text-base font-semibold leading-snug text-on-surface transition-colors group-hover:text-secondary">
          {event.title}
        </h3>
        <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4">
          <span className="inline-flex items-center gap-1.5 font-body text-xs text-on-surface-variant">
            <HugeiconsIcon icon={Calendar03Icon} size={13} strokeWidth={1.8} />
            {event.dateLabel}
          </span>
          <HugeiconsIcon className="text-outline rtl:rotate-180 transition-colors group-hover:text-secondary" icon={ArrowRight01Icon} size={18} strokeWidth={1.8} />
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd c:/web/kayan-training-nextjs && pnpm build 2>&1 | tail -20
```

Expected: no TypeScript errors related to event-card.

- [ ] **Step 3: Commit**

```bash
git add src/components/events/event-card.tsx
git commit -m "fix: event card image inset-0 full-card overlay layout"
```

---

## Task 2: Fix Rich Text Rendering on Event Detail Page

**Files:**
- Modify: `src/app/[locale]/events/[slug]/page.tsx`

`plainTextBlocks()` strips all HTML formatting. The RTE stores HTML strings in `EventTranslation.description`. Need to detect string vs ProseMirror JSON doc and render appropriately.

- [ ] **Step 1: Add `renderDescription` helper and replace `plainTextBlocks` usage**

At the top of `src/app/[locale]/events/[slug]/page.tsx`, replace the `plainTextBlocks` function with:

```tsx
import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

function renderDescription(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const doc = value as { type?: string; content?: unknown[] };
    if (doc.type === "doc" && doc.content) {
      try {
        return generateHTML(doc as Parameters<typeof generateHTML>[0], [StarterKit]);
      } catch {
        // fall through
      }
    }
  }
  return fallback ? `<p>${fallback}</p>` : "";
}
```

- [ ] **Step 2: Replace all `contentBlocks` usages**

Find the two lines:
```tsx
const contentBlocks = plainTextBlocks(event.description, event.excerpt);
```
Replace with:
```tsx
const descriptionHtml = renderDescription(event.description, event.excerpt ?? "");
```

Find all `{contentBlocks.map((block) => <p key={block}>{block}</p>)}` and replace with:
```tsx
<div
  className="rte-content prose prose-sm max-w-none prose-headings:text-on-surface prose-p:text-on-surface-variant prose-strong:text-on-surface prose-a:text-secondary"
  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
/>
```

There are two occurrences of `contentBlocks.map(...)` — one in the featured layout and one in the standard layout. Replace both.

- [ ] **Step 3: Remove `plainTextBlocks` function**

Delete the entire `plainTextBlocks` function (lines 33–40 in the original file).

- [ ] **Step 4: Verify build**

```bash
pnpm build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\[locale\]/events/\[slug\]/page.tsx
git commit -m "fix: render rich text HTML on event detail page"
```

---

## Task 3: Fix Locale Switcher

**Files:**
- Modify: `src/components/i18n/locale-switcher.tsx`

Current: shows "AR"/"EN" in fixed 9×9 box. Fix: show full language name, auto-width.

- [ ] **Step 1: Replace locale-switcher.tsx**

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";

import { LOCALE_COOKIE_KEY, type AppLocale } from "@/lib/i18n/config";

export function LocaleSwitcher({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(nextLocale: AppLocale) {
    if (!pathname) return;
    const segments = pathname.split("/");
    if (segments.length > 1) segments[1] = nextLocale;
    document.cookie = `${LOCALE_COOKIE_KEY}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.replace(segments.join("/"));
    router.refresh();
  }

  const nextLocale: AppLocale = locale === "en" ? "ar" : "en";
  const nextLabel = locale === "en" ? "العربية" : "English";

  return (
    <button
      className="ghost-border inline-flex h-9 items-center px-3 text-[12px] font-semibold text-on-surface-variant transition-colors hover:text-primary"
      onClick={() => switchLocale(nextLocale)}
      type="button"
      dir="ltr"
    >
      {nextLabel}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/i18n/locale-switcher.tsx
git commit -m "fix: locale switcher shows full language name"
```

---

## Task 4: Nav Menu from Database

**Files:**
- Modify: `src/components/layout/nav.tsx`

Convert to accept optional `menuItems` prop with DB-driven data. Add a server wrapper in the layout.

- [ ] **Step 1: Add `menuItems` prop to SiteNav and use it with fallback**

In `src/components/layout/nav.tsx`, change the hardcoded `links` to accept an optional prop:

```tsx
export type NavMenuItem = {
  href: string;
  labelAr: string;
  labelEn: string;
};

export function SiteNav({
  locale,
  menuItems,
}: {
  locale: "ar" | "en";
  menuItems?: NavMenuItem[];
}) {
```

Then replace the hardcoded `const links = [...]` block with:

```tsx
const fallbackLinks: NavMenuItem[] = [
  { href: `/${locale}`, labelAr: "الرئيسية", labelEn: "Home" },
  { href: `/${locale}/events`, labelAr: "الفعاليات", labelEn: "Events" },
  { href: `/${locale}/posts`, labelAr: "المقالات", labelEn: "Posts" },
  { href: `/${locale}/services`, labelAr: "خدماتنا", labelEn: "Services" },
  { href: `/${locale}/knowledge`, labelAr: "المعرفة", labelEn: "Knowledge" },
  { href: `/${locale}/about`, labelAr: "عن كيان", labelEn: "About" },
];

const links = menuItems ?? fallbackLinks;
```

- [ ] **Step 2: Find where SiteNav is rendered (layout.tsx) and pass DB menu items**

Find `src/app/[locale]/layout.tsx`. Add menu fetch:

```tsx
import { db } from "@/lib/db";
import { SiteNav, type NavMenuItem } from "@/components/layout/nav";

// inside the layout function, before return:
const mainMenu = await db.menu.findUnique({
  where: { location: "main" },
  include: {
    items: {
      include: { translations: true },
      orderBy: { order: "asc" },
    },
  },
}).catch(() => null);

const menuItems: NavMenuItem[] | undefined = mainMenu?.items.map((item) => {
  const labelAr = item.translations.find((t) => t.locale === "ar")?.label ?? "";
  const labelEn = item.translations.find((t) => t.locale === "en")?.label ?? "";
  const href = item.url ?? `/${activeLocale}`;
  return { href, labelAr, labelEn };
});
```

Then in the JSX, pass it:
```tsx
<SiteNav locale={activeLocale} menuItems={menuItems} />
```

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/nav.tsx src/app/\[locale\]/layout.tsx
git commit -m "feat: nav menu driven from DB with hardcoded fallback"
```

---

## Task 5: Add showMapEmbed + googleMapsLink to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

These fields are in `EventFormValues` Zod schema but missing from the DB.

- [ ] **Step 1: Add fields to Event model in schema.prisma**

After the `isCertified` line in the Event model, add:

```prisma
showMapEmbed   Boolean @default(false)
googleMapsLink String?
```

- [ ] **Step 2: Run migration**

```bash
cd c:/web/kayan-training-nextjs && npx prisma migrate dev --name add_event_map_fields
```

Expected: migration created and applied, Prisma client regenerated.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add showMapEmbed and googleMapsLink to Event model"
```

---

## Task 6: Dashboard Sidebar → shadcn Sidebar

**Files:**
- Modify: `src/app/[locale]/dashboard/layout.tsx`
- Modify: `src/components/layout/admin-sidebar.tsx`

- [ ] **Step 1: Rewrite admin-sidebar.tsx using shadcn Sidebar primitives**

```tsx
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
                <SidebarMenuButton asChild isActive={active}>
                  <Link href={href}>
                    <HugeiconsIcon icon={link.icon} size={17} strokeWidth={1.8} />
                    <span>{link.label}</span>
                  </Link>
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
```

- [ ] **Step 2: Rewrite dashboard/layout.tsx with SidebarProvider + SidebarInset**

```tsx
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isSupportedLocale } from "@/lib/i18n/config";
import { requireAdminSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const session = await requireAdminSession();

  if (!session) {
    redirect(`/${activeLocale}/auth`);
  }

  return (
    <div className="dashboard-theme">
      <SidebarProvider>
        <AdminSidebar locale={activeLocale} userEmail={session.user.email} />
        <SidebarInset>
          <main className="min-h-screen p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/admin-sidebar.tsx src/app/\[locale\]/dashboard/layout.tsx
git commit -m "feat: dashboard sidebar refactored to shadcn Sidebar with user footer"
```

---

## Task 7: Events Edit Page → EventForm

**Files:**
- Create: `src/app/[locale]/dashboard/events/_actions.ts`
- Modify: `src/app/[locale]/dashboard/events/[id]/page.tsx`

- [ ] **Step 1: Create `_actions.ts` with updateEventAction**

```ts
"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import type { EventFormValues } from "./_components/event-form";

export async function updateEventAction(
  id: string,
  locale: string,
  values: EventFormValues,
): Promise<{ error?: string }> {
  try {
    await db.event.update({
      where: { id },
      data: {
        slug: values.slug,
        status: values.status,
        type: values.type,
        language: values.language,
        coverImage: values.coverImage || null,
        location: values.location || null,
        capacity: values.capacity ? Number(values.capacity) : null,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        registrationDeadline: values.registrationDeadline ? new Date(values.registrationDeadline) : null,
        price: values.price,
        isFree: values.isFree,
        isFeatured: values.isFeatured,
        isCertified: values.isCertified,
        registrationsOpen: values.registrationsOpen,
        meetingLink: values.meetingLink || null,
        meetingPlatform: values.meetingLink ? values.meetingPlatform : null,
        paymentMethods: values.paymentMethods,
        showMapEmbed: values.showMapEmbed,
        googleMapsLink: values.googleMapsLink || null,
      },
    });

    // Upsert EN translation
    await db.eventTranslation.upsert({
      where: { eventId_locale: { eventId: id, locale: "en" } },
      create: {
        eventId: id,
        locale: "en",
        title: values.titleEn,
        shortDescription: values.shortEn || null,
        description: values.contentEn || null,
        seoTitle: values.seoTitleEn || null,
        seoDescription: values.seoDescriptionEn || null,
      },
      update: {
        title: values.titleEn,
        shortDescription: values.shortEn || null,
        description: values.contentEn || null,
        seoTitle: values.seoTitleEn || null,
        seoDescription: values.seoDescriptionEn || null,
      },
    });

    // Upsert AR translation
    await db.eventTranslation.upsert({
      where: { eventId_locale: { eventId: id, locale: "ar" } },
      create: {
        eventId: id,
        locale: "ar",
        title: values.titleAr,
        shortDescription: values.shortAr || null,
        description: values.contentAr || null,
        seoTitle: values.seoTitleAr || null,
        seoDescription: values.seoDescriptionAr || null,
      },
      update: {
        title: values.titleAr,
        shortDescription: values.shortAr || null,
        description: values.contentAr || null,
        seoTitle: values.seoTitleAr || null,
        seoDescription: values.seoDescriptionAr || null,
      },
    });

    // Sync trainers: delete all, recreate
    await db.eventTrainer.deleteMany({ where: { eventId: id } });
    if (values.trainerIds.length > 0) {
      await db.eventTrainer.createMany({
        data: values.trainerIds.map((trainerId, i) => ({ eventId: id, trainerId, sortOrder: i })),
      });
    }

    // Sync agenda: delete all, recreate
    await db.agendaSession.deleteMany({ where: { eventId: id } });
    if (values.agenda.length > 0) {
      await db.agendaSession.createMany({
        data: values.agenda.map((item, i) => ({
          eventId: id,
          day: item.day,
          time: item.time,
          title: item.title,
          type: item.type,
          trainerId: item.trainerId || null,
          order: i,
        })),
      });
    }

    // Sync categories: delete all, recreate
    await db.eventCategory.deleteMany({ where: { eventId: id } });
    if (values.categories.length > 0) {
      await db.eventCategory.createMany({
        data: values.categories.map((categoryId) => ({ eventId: id, categoryId })),
      });
    }

    // Sync registration form fields
    await db.registrationFormField.deleteMany({ where: { eventId: id } });
    if (values.registrationFields.length > 0) {
      for (let i = 0; i < values.registrationFields.length; i++) {
        const field = values.registrationFields[i];
        await db.registrationFormField.create({
          data: {
            eventId: id,
            type: field.type,
            required: field.required,
            order: i,
            translations: {
              create: [
                {
                  locale: "en",
                  label: field.labelEn,
                  placeholder: field.placeholderEn || null,
                },
                {
                  locale: "ar",
                  label: field.labelAr,
                  placeholder: field.placeholderAr || null,
                },
              ],
            },
          },
        });
      }
    }

    revalidatePath(`/${locale}/dashboard/events`);
    revalidatePath(`/${locale}/events`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save event" };
  }
}
```

- [ ] **Step 2: Rewrite `[id]/page.tsx` to load full data and render EventForm**

```tsx
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { EventForm, type EventFormValues } from "../_components/event-form";
import { updateEventAction } from "../_actions";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const [event, allTrainers, allCategories] = await Promise.all([
    db.event.findUnique({
      where: { id },
      include: {
        translations: true,
        trainers: { include: { trainer: { include: { translations: true } } }, orderBy: { sortOrder: "asc" } },
        agendaSessions: { orderBy: { order: "asc" } },
        categories: true,
        formFields: { include: { translations: true }, orderBy: { order: "asc" } },
      },
    }),
    db.trainer.findMany({
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.category.findMany({
      include: { translations: true },
      orderBy: { slug: "asc" },
    }),
  ]);

  if (!event) notFound();

  const trEn = event.translations.find((t) => t.locale === "en");
  const trAr = event.translations.find((t) => t.locale === "ar");

  const defaultValues: Partial<EventFormValues> = {
    slug: event.slug,
    status: event.status as EventFormValues["status"],
    type: event.type as EventFormValues["type"],
    language: (event.language ?? "both") as EventFormValues["language"],
    coverImage: event.coverImage ?? "",
    location: event.location ?? "",
    capacity: event.capacity?.toString() ?? "",
    startDate: event.startDate.toISOString().slice(0, 10),
    endDate: event.endDate.toISOString().slice(0, 10),
    registrationDeadline: event.registrationDeadline?.toISOString().slice(0, 10) ?? "",
    price: event.price.toString(),
    isFree: event.isFree,
    isFeatured: event.isFeatured,
    isCertified: event.isCertified,
    registrationsOpen: event.registrationsOpen,
    meetingLink: event.meetingLink ?? "",
    meetingPlatform: (event.meetingPlatform ?? "zoom") as EventFormValues["meetingPlatform"],
    paymentMethods: (event.paymentMethods ?? "both") as EventFormValues["paymentMethods"],
    showMapEmbed: (event as { showMapEmbed?: boolean }).showMapEmbed ?? false,
    googleMapsLink: (event as { googleMapsLink?: string }).googleMapsLink ?? "",
    titleEn: trEn?.title ?? "",
    titleAr: trAr?.title ?? "",
    shortEn: trEn?.shortDescription ?? "",
    shortAr: trAr?.shortDescription ?? "",
    contentEn: typeof trEn?.description === "string" ? trEn.description : "",
    contentAr: typeof trAr?.description === "string" ? trAr.description : "",
    seoTitleEn: trEn?.seoTitle ?? "",
    seoTitleAr: trAr?.seoTitle ?? "",
    seoDescriptionEn: trEn?.seoDescription ?? "",
    seoDescriptionAr: trAr?.seoDescription ?? "",
    trainerIds: event.trainers.map((et) => et.trainerId),
    categories: event.categories.map((ec) => ec.categoryId),
    agenda: event.agendaSessions.map((s) => ({
      day: s.day,
      time: s.time,
      title: s.title,
      type: s.type as EventFormValues["agenda"][number]["type"],
      trainerId: s.trainerId ?? undefined,
    })),
    registrationFields: event.formFields.map((f) => ({
      id: f.id,
      type: f.type as EventFormValues["registrationFields"][number]["type"],
      required: f.required,
      labelEn: f.translations.find((t) => t.locale === "en")?.label ?? "",
      labelAr: f.translations.find((t) => t.locale === "ar")?.label ?? "",
      placeholderEn: f.translations.find((t) => t.locale === "en")?.placeholder ?? "",
      placeholderAr: f.translations.find((t) => t.locale === "ar")?.placeholder ?? "",
      optionsEn: "",
      optionsAr: "",
    })),
  };

  const trainerOptions = allTrainers.map((t) => {
    const label = t.translations.find((tr) => tr.locale === "en")?.name ?? t.name ?? t.id;
    return { value: t.id, label };
  });

  const categoryOptions = allCategories.map((c) => {
    const label = c.translations.find((tr) => tr.locale === "en")?.name ?? c.slug;
    return { value: c.id, label };
  });

  const boundAction = updateEventAction.bind(null, id, activeLocale);

  return (
    <EventForm
      categoryOptions={categoryOptions}
      defaultValues={defaultValues}
      eventId={id}
      locale={activeLocale}
      onSubmit={boundAction}
      submitLabel="Save Changes"
      trainerOptions={trainerOptions}
    />
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\[locale\]/dashboard/events/_actions.ts src/app/\[locale\]/dashboard/events/\[id\]/page.tsx
git commit -m "feat: events edit page wired to EventForm with full data sync"
```

---

## Task 8: Events New Page → EventForm

**Files:**
- Modify: `src/app/[locale]/dashboard/events/_actions.ts` (add createEventAction)
- Modify: `src/app/[locale]/dashboard/events/new/page.tsx`

- [ ] **Step 1: Add `createEventAction` to `_actions.ts`**

Append to `_actions.ts`:

```ts
import { redirect } from "next/navigation";

export async function createEventAction(
  locale: string,
  values: EventFormValues,
): Promise<{ error?: string }> {
  try {
    const created = await db.event.create({
      data: {
        slug: values.slug,
        status: values.status,
        type: values.type,
        language: values.language,
        coverImage: values.coverImage || null,
        location: values.location || null,
        capacity: values.capacity ? Number(values.capacity) : null,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        registrationDeadline: values.registrationDeadline ? new Date(values.registrationDeadline) : null,
        price: values.price,
        isFree: values.isFree,
        isFeatured: values.isFeatured,
        isCertified: values.isCertified,
        registrationsOpen: values.registrationsOpen,
        meetingLink: values.meetingLink || null,
        meetingPlatform: values.meetingLink ? values.meetingPlatform : null,
        paymentMethods: values.paymentMethods,
        showMapEmbed: values.showMapEmbed,
        googleMapsLink: values.googleMapsLink || null,
        translations: {
          create: [
            {
              locale: "en",
              title: values.titleEn,
              shortDescription: values.shortEn || null,
              description: values.contentEn || null,
              seoTitle: values.seoTitleEn || null,
              seoDescription: values.seoDescriptionEn || null,
            },
            {
              locale: "ar",
              title: values.titleAr,
              shortDescription: values.shortAr || null,
              description: values.contentAr || null,
              seoTitle: values.seoTitleAr || null,
              seoDescription: values.seoDescriptionAr || null,
            },
          ],
        },
        trainers: values.trainerIds.length > 0 ? {
          create: values.trainerIds.map((trainerId, i) => ({ trainerId, sortOrder: i })),
        } : undefined,
        agendaSessions: values.agenda.length > 0 ? {
          create: values.agenda.map((item, i) => ({
            day: item.day,
            time: item.time,
            title: item.title,
            type: item.type,
            trainerId: item.trainerId || null,
            order: i,
          })),
        } : undefined,
        categories: values.categories.length > 0 ? {
          create: values.categories.map((categoryId) => ({ categoryId })),
        } : undefined,
      },
    });

    revalidatePath(`/${locale}/dashboard/events`);
    redirect(`/${locale}/dashboard/events/${created.id}`);
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: err instanceof Error ? err.message : "Failed to create event" };
  }
}
```

- [ ] **Step 2: Rewrite `new/page.tsx`**

```tsx
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { EventForm } from "../_components/event-form";
import { createEventAction } from "../_actions";

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const [allTrainers, allCategories] = await Promise.all([
    db.trainer.findMany({ include: { translations: true }, orderBy: { sortOrder: "asc" } }),
    db.category.findMany({ include: { translations: true }, orderBy: { slug: "asc" } }),
  ]);

  const trainerOptions = allTrainers.map((t) => ({
    value: t.id,
    label: t.translations.find((tr) => tr.locale === "en")?.name ?? t.name ?? t.id,
  }));

  const categoryOptions = allCategories.map((c) => ({
    value: c.id,
    label: c.translations.find((tr) => tr.locale === "en")?.name ?? c.slug,
  }));

  const boundAction = createEventAction.bind(null, activeLocale);

  return (
    <EventForm
      categoryOptions={categoryOptions}
      locale={activeLocale}
      onSubmit={boundAction}
      submitLabel="Create Event"
      trainerOptions={trainerOptions}
    />
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\[locale\]/dashboard/events/_actions.ts src/app/\[locale\]/dashboard/events/new/page.tsx
git commit -m "feat: events new page wired to EventForm"
```

---

## Task 9: Registrations List — Production Table

**Files:**
- Modify: `src/app/[locale]/dashboard/registrations/registrations-table.tsx`
- Modify: `src/app/[locale]/dashboard/registrations/page.tsx`
- Create: `src/app/[locale]/dashboard/registrations/_actions.ts`

- [ ] **Step 1: Create `_actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function updateRegistrationStatus(
  id: string,
  status: string,
  locale: string,
): Promise<{ error?: string }> {
  try {
    await db.registration.update({ where: { id }, data: { status } });
    revalidatePath(`/${locale}/dashboard/registrations`);
    return {};
  } catch {
    return { error: "Failed to update status" };
  }
}

export async function bulkUpdateRegistrationStatus(
  ids: string[],
  status: string,
  locale: string,
): Promise<{ error?: string }> {
  try {
    await db.registration.updateMany({ where: { id: { in: ids } }, data: { status } });
    revalidatePath(`/${locale}/dashboard/registrations`);
    return {};
  } catch {
    return { error: "Failed to bulk update" };
  }
}

export async function deleteRegistrations(
  ids: string[],
  locale: string,
): Promise<{ error?: string }> {
  try {
    await db.registration.deleteMany({ where: { id: { in: ids } } });
    revalidatePath(`/${locale}/dashboard/registrations`);
    return {};
  } catch {
    return { error: "Failed to delete registrations" };
  }
}
```

- [ ] **Step 2: Write `registrations-table.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { FilterResetIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  bulkUpdateRegistrationStatus,
  deleteRegistrations,
} from "./_actions";

export type RegistrationRow = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  registrantName: string;
  registrantEmail: string;
  status: string;
  paymentStatus: string;
  amount: string | null;
  createdAt: Date;
  locale: string;
};

const statusColors: Record<string, string> = {
  confirmed: "border-green-500/40 bg-green-500/10 text-green-700",
  pending: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700",
  cancelled: "border-red-500/40 bg-red-500/10 text-red-600",
  attended: "border-blue-500/40 bg-blue-500/10 text-blue-700",
};

function exportCsv(rows: RegistrationRow[]) {
  const header = ["ID", "Event", "Name", "Email", "Status", "Payment", "Amount", "Date"].join(",");
  const lines = rows.map((r) =>
    [
      r.id,
      `"${r.eventTitle.replace(/"/g, '""')}"`,
      `"${r.registrantName.replace(/"/g, '""')}"`,
      r.registrantEmail,
      r.status,
      r.paymentStatus,
      r.amount ?? "0",
      r.createdAt.toISOString().slice(0, 10),
    ].join(",")
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "registrations.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function RegistrationsTable({
  locale,
  registrations,
}: {
  locale: string;
  registrations: RegistrationRow[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return registrations.filter((r) => {
      const matchesQuery =
        !q ||
        r.registrantName.toLowerCase().includes(q) ||
        r.registrantEmail.toLowerCase().includes(q) ||
        r.eventTitle.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [registrations, query, statusFilter]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.add(r.id));
        return next;
      });
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkStatus(status: string) {
    const ids = [...selected];
    startTransition(async () => {
      const result = await bulkUpdateRegistrationStatus(ids, status, locale);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Updated ${ids.length} registration(s) to ${status}`);
        setSelected(new Set());
      }
    });
  }

  function handleDelete(ids: string[]) {
    startTransition(async () => {
      const result = await deleteRegistrations(ids, locale);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Deleted ${ids.length} registration(s)`);
        setSelected(new Set());
      }
    });
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_auto_auto]">
          <div className="relative">
            <HugeiconsIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" icon={Search01Icon} strokeWidth={2} />
            <Input className="h-10 pl-9" onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, event..." value={query} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10"><span className="text-sm">{statusFilter === "all" ? "All statuses" : statusFilter}</span></SelectTrigger>
            <SelectContent>
              {["all", "pending", "confirmed", "cancelled", "attended"].map((s) => (
                <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="h-10" onClick={() => exportCsv(filtered)} size="sm" variant="outline">
            Export CSV
          </Button>
          <button
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { setQuery(""); setStatusFilter("all"); }}
            type="button"
          >
            <HugeiconsIcon className="size-3.5" icon={FilterResetIcon} strokeWidth={2} /> Reset
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{registrations.length}</span> registrations
        </p>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex gap-2">
            {["confirmed", "pending", "cancelled"].map((s) => (
              <Button
                disabled={isPending}
                key={s}
                onClick={() => handleBulkStatus(s)}
                size="sm"
                variant="outline"
              >
                Mark {s}
              </Button>
            ))}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isPending} size="sm" variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selected.size} registration(s)?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete([...selected])}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Registrant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-sm text-muted-foreground" colSpan={6}>
                  No registrations found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} />
                  </TableCell>
                  <TableCell>
                    <Link className="font-medium hover:text-primary" href={`/${locale}/dashboard/registrations/${r.eventId}`}>
                      <span className="line-clamp-1 text-sm">{r.eventTitle}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{r.registrantName}</p>
                    <p className="text-xs text-muted-foreground">{r.registrantEmail}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border capitalize", statusColors[r.status] ?? "")} variant="outline">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-xs text-muted-foreground">{r.paymentStatus}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(r.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `registrations/page.tsx` to use RegistrationsTable**

```tsx
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { RegistrationsTable, type RegistrationRow } from "./registrations-table";

export default async function RegistrationsDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const registrations = await db.registration.findMany({
    include: {
      event: { include: { translations: { where: { locale: activeLocale }, take: 1 } } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: RegistrationRow[] = registrations.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    eventTitle: r.event.translations[0]?.title ?? r.event.slug,
    eventSlug: r.event.slug,
    registrantName: r.user?.name ?? r.user?.email ?? "Guest",
    registrantEmail: r.user?.email ?? "",
    status: r.status,
    paymentStatus: r.paymentStatus,
    amount: r.amount?.toString() ?? null,
    createdAt: r.createdAt,
    locale: activeLocale,
  }));

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">Registrations</h1>
      </div>
      <RegistrationsTable locale={activeLocale} registrations={rows} />
    </section>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
pnpm build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\[locale\]/dashboard/registrations/
git commit -m "feat: registrations dashboard — full production table with bulk actions"
```

---

## Task 10: Per-Event Registrations — Production

**Files:**
- Modify: `src/app/[locale]/dashboard/registrations/[eventId]/page.tsx`

- [ ] **Step 1: Rewrite `[eventId]/page.tsx`**

```tsx
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { RegistrationsTable, type RegistrationRow } from "../registrations-table";

export default async function EventRegistrationsPage({
  params,
}: {
  params: Promise<{ locale: string; eventId: string }>;
}) {
  const { locale, eventId } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      translations: { where: { locale: activeLocale }, take: 1 },
      registrations: {
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!event) notFound();

  const eventTitle = event.translations[0]?.title ?? event.slug;

  const rows: RegistrationRow[] = event.registrations.map((r) => ({
    id: r.id,
    eventId: event.id,
    eventTitle,
    eventSlug: event.slug,
    registrantName: r.user?.name ?? r.user?.email ?? "Guest",
    registrantEmail: r.user?.email ?? "",
    status: r.status,
    paymentStatus: r.paymentStatus,
    amount: r.amount?.toString() ?? null,
    createdAt: r.createdAt,
    locale: activeLocale,
  }));

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">{eventTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{rows.length} registrations</p>
      </div>
      <RegistrationsTable locale={activeLocale} registrations={rows} />
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\[locale\]/dashboard/registrations/\[eventId\]/page.tsx
git commit -m "feat: per-event registrations page uses production table"
```

---

## Task 11: Posts Dashboard — Production Table + Form Wire

**Files:**
- Modify: `src/app/[locale]/dashboard/posts/posts-table.tsx`
- Modify: `src/app/[locale]/dashboard/posts/page.tsx`
- Check/fix: `src/app/[locale]/dashboard/posts/[id]/page.tsx`
- Check/fix: `src/app/[locale]/dashboard/posts/new/page.tsx`

- [ ] **Step 1: Rebuild `posts-table.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilterResetIcon, MoreHorizontalIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: Date;
  locale: string;
};

const statusColors: Record<string, string> = {
  published: "border-green-500/40 bg-green-500/10 text-green-700",
  draft: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700",
  archived: "border-zinc-400/40 bg-zinc-400/10 text-zinc-600",
};

export function PostsTable({ locale, posts }: { locale: string; posts: PostRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.slug.includes(q);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [posts, query, statusFilter]);

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_auto]">
          <div className="relative">
            <HugeiconsIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" icon={Search01Icon} strokeWidth={2} />
            <Input className="h-10 pl-9" onChange={(e) => setQuery(e.target.value)} placeholder="Search posts..." value={query} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10"><span className="text-sm">{statusFilter === "all" ? "All statuses" : statusFilter}</span></SelectTrigger>
            <SelectContent>
              {["all", "published", "draft", "archived"].map((s) => (
                <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { setQuery(""); setStatusFilter("all"); }}
            type="button"
          >
            <HugeiconsIcon className="size-3.5" icon={FilterResetIcon} strokeWidth={2} /> Reset
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{posts.length}</span> posts
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead className="w-[55%]">Post</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-sm text-muted-foreground" colSpan={4}>
                  No posts found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Link className="line-clamp-1 text-sm font-semibold hover:text-primary" href={`/${locale}/dashboard/posts/${post.id}`}>
                      {post.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">{post.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border capitalize", statusColors[post.status] ?? "")} variant="outline">
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(post.publishedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-8 px-3 text-xs")} href={`/${locale}/dashboard/posts/${post.id}`}>
                        Edit
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn(buttonVariants({ size: "icon-sm", variant: "outline" }))}>
                          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link href={`/${locale}/posts/${post.slug}`} target="_blank" />}>View on site</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `posts/page.tsx` to use PostsTable**

```tsx
import Link from "next/link";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { buttonVariants } from "@/components/ui/button";
import { PostsTable, type PostRow } from "./posts-table";

export default async function PostsDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const posts = await db.post.findMany({
    include: { translations: { where: { locale: activeLocale }, take: 1 } },
    orderBy: { publishedAt: "desc" },
  });

  const rows: PostRow[] = posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.translations[0]?.title ?? p.slug,
    status: p.status,
    publishedAt: p.publishedAt,
    locale: activeLocale,
  }));

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">Posts</h1>
        <Link className={buttonVariants({ size: "sm" })} href={`/${activeLocale}/dashboard/posts/new`}>
          New Post
        </Link>
      </div>
      <PostsTable locale={activeLocale} posts={rows} />
    </section>
  );
}
```

- [ ] **Step 3: Read `posts/[id]/page.tsx` to see if PostForm is already wired**

Check the file. If it uses a raw HTML form (like the events edit page did), wire it to `PostForm` from `_components/post-form.tsx` following the same pattern as Task 7. The `PostForm` component exists at `src/app/[locale]/dashboard/posts/_components/post-form.tsx`.

If it already uses `PostForm`, verify the `onSubmit` action covers all fields including content.

- [ ] **Step 4: Commit**

```bash
git add src/app/\[locale\]/dashboard/posts/
git commit -m "feat: posts dashboard — production table + PostForm wired"
```

---

## Task 12: Categories Dashboard — Full CRUD

**Files:**
- Modify: `src/app/[locale]/dashboard/categories/page.tsx`
- Create: `src/app/[locale]/dashboard/categories/_actions.ts`
- Create: `src/app/[locale]/dashboard/categories/categories-manager.tsx`

- [ ] **Step 1: Create `_actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function createCategory(
  slug: string,
  nameEn: string,
  nameAr: string,
  icon: string,
  color: string,
  locale: string,
): Promise<{ error?: string }> {
  if (!slug || !nameEn || !nameAr) return { error: "Slug and names required" };
  try {
    await db.category.create({
      data: {
        slug,
        icon: icon || "tag",
        color: color || "#888888",
        translations: {
          create: [
            { locale: "en", name: nameEn },
            { locale: "ar", name: nameAr },
          ],
        },
      },
    });
    revalidatePath(`/${locale}/dashboard/categories`);
    return {};
  } catch {
    return { error: "Failed to create category (slug may already exist)" };
  }
}

export async function deleteCategory(id: string, locale: string): Promise<{ error?: string }> {
  try {
    await db.category.delete({ where: { id } });
    revalidatePath(`/${locale}/dashboard/categories`);
    return {};
  } catch {
    return { error: "Failed to delete category" };
  }
}
```

- [ ] **Step 2: Write `categories-manager.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategory, deleteCategory } from "./_actions";

export type CategoryItem = {
  id: string;
  slug: string;
  icon: string;
  color: string;
  nameEn: string;
  nameAr: string;
};

export function CategoriesManager({
  categories,
  locale,
}: {
  categories: CategoryItem[];
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ slug: "", nameEn: "", nameAr: "", icon: "", color: "" });

  function handleCreate() {
    startTransition(async () => {
      const result = await createCategory(form.slug, form.nameEn, form.nameAr, form.icon, form.color, locale);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Category created");
        setForm({ slug: "", nameEn: "", nameAr: "", icon: "", color: "" });
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id, locale);
      if (result.error) toast.error(result.error);
      else toast.success("Category deleted");
    });
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Add Category</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="Slug (e.g. leadership)" value={form.slug} />
          <Input onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} placeholder="Name (EN)" value={form.nameEn} />
          <Input onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} placeholder="Name (AR)" value={form.nameAr} />
          <Input onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="Icon (e.g. tag)" value={form.icon} />
          <Input onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="Color (e.g. #3b82f6)" value={form.color} />
        </div>
        <Button className="mt-3" disabled={isPending || !form.slug || !form.nameEn} onClick={handleCreate} size="sm">
          {isPending ? "Creating…" : "Create Category"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((cat) => (
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-4" key={cat.id}>
            <div>
              <p className="text-sm font-semibold">{cat.nameEn} / {cat.nameAr}</p>
              <p className="text-xs text-muted-foreground">{cat.slug}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isPending} size="sm" variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{cat.nameEn}"?</AlertDialogTitle>
                  <AlertDialogDescription>This removes the category from all events and posts.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(cat.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `categories/page.tsx`**

```tsx
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { CategoriesManager, type CategoryItem } from "./categories-manager";

export default async function CategoriesDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";
  const raw = await db.category.findMany({
    include: { translations: true },
    orderBy: { slug: "asc" },
  });

  const categories: CategoryItem[] = raw.map((c) => ({
    id: c.id,
    slug: c.slug,
    icon: c.icon,
    color: c.color,
    nameEn: c.translations.find((t) => t.locale === "en")?.name ?? c.slug,
    nameAr: c.translations.find((t) => t.locale === "ar")?.name ?? c.slug,
  }));

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">Categories</h1>
      </div>
      <CategoriesManager categories={categories} locale={activeLocale} />
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\[locale\]/dashboard/categories/
git commit -m "feat: categories dashboard — full CRUD with AlertDialog confirm"
```

---

## Task 13: Users Dashboard — Production Table

**Files:**
- Create: `src/app/[locale]/dashboard/users/users-table.tsx`
- Modify: `src/app/[locale]/dashboard/users/page.tsx`
- Create: `src/app/[locale]/dashboard/users/_actions.ts`

- [ ] **Step 1: Create `_actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function setUserRole(id: string, role: string, locale: string): Promise<{ error?: string }> {
  try {
    await db.user.update({ where: { id }, data: { role } });
    revalidatePath(`/${locale}/dashboard/users`);
    return {};
  } catch {
    return { error: "Failed to update role" };
  }
}

export async function toggleBanUser(id: string, banned: boolean, locale: string): Promise<{ error?: string }> {
  try {
    await db.user.update({ where: { id }, data: { banned, banReason: banned ? "Banned by admin" : null } });
    revalidatePath(`/${locale}/dashboard/users`);
    return {};
  } catch {
    return { error: "Failed to update ban status" };
  }
}
```

- [ ] **Step 2: Write `users-table.tsx`**

```tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { FilterResetIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { setUserRole, toggleBanUser } from "./_actions";

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  banned: boolean;
  createdAt: Date;
  locale: string;
};

export function UsersTable({ locale, users }: { locale: string; users: UserRow[] }) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery = !q || (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  function handleRoleChange(id: string, role: string) {
    startTransition(async () => {
      const result = await setUserRole(id, role, locale);
      if (result.error) toast.error(result.error);
      else toast.success("Role updated");
    });
  }

  function handleToggleBan(id: string, currentlyBanned: boolean) {
    startTransition(async () => {
      const result = await toggleBanUser(id, !currentlyBanned, locale);
      if (result.error) toast.error(result.error);
      else toast.success(currentlyBanned ? "User unbanned" : "User banned");
    });
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_auto]">
          <div className="relative">
            <HugeiconsIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" icon={Search01Icon} strokeWidth={2} />
            <Input className="h-10 pl-9" onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email..." value={query} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-10"><span className="text-sm">{roleFilter === "all" ? "All roles" : roleFilter}</span></SelectTrigger>
            <SelectContent>
              {["all", "user", "admin"].map((r) => <SelectItem key={r} value={r}>{r === "all" ? "All roles" : r}</SelectItem>)}
            </SelectContent>
          </Select>
          <button
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { setQuery(""); setRoleFilter("all"); }}
            type="button"
          >
            <HugeiconsIcon className="size-3.5" icon={FilterResetIcon} strokeWidth={2} /> Reset
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{users.length}</span> users
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="text-sm font-medium">{user.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(role) => handleRoleChange(user.id, role)}
                  >
                    <SelectTrigger className="h-8 w-24 text-xs"><span>{user.role}</span></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">user</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {user.banned ? (
                    <Badge className="border-red-500/40 bg-red-500/10 text-red-600" variant="outline">Banned</Badge>
                  ) : (
                    <Badge className="border-green-500/40 bg-green-500/10 text-green-700" variant="outline">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(user.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className={cn("h-8 px-3 text-xs", user.banned ? "" : "border-red-200 text-red-600 hover:bg-red-50")}
                        disabled={isPending}
                        size="sm"
                        variant="outline"
                      >
                        {user.banned ? "Unban" : "Ban"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{user.banned ? "Unban" : "Ban"} {user.email}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {user.banned ? "User will regain access to their account." : "User will be immediately locked out."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleToggleBan(user.id, user.banned)}>
                          {user.banned ? "Unban" : "Ban"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `users/page.tsx`**

```tsx
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { UsersTable, type UserRow } from "./users-table";

export default async function UsersDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    banned: u.banned,
    createdAt: u.createdAt,
    locale: activeLocale,
  }));

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">Users</h1>
      </div>
      <UsersTable locale={activeLocale} users={rows} />
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\[locale\]/dashboard/users/
git commit -m "feat: users dashboard — production table with role management and ban"
```

---

## Task 14: Media Dashboard — Delete with AlertDialog

**Files:**
- Create: `src/app/[locale]/dashboard/media/media-grid.tsx`
- Modify: `src/app/[locale]/dashboard/media/page.tsx`
- Create: `src/app/[locale]/dashboard/media/_actions.ts`

- [ ] **Step 1: Create `_actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function deleteMedia(id: string, locale: string): Promise<{ error?: string }> {
  try {
    await db.media.delete({ where: { id } });
    revalidatePath(`/${locale}/dashboard/media`);
    return {};
  } catch {
    return { error: "Failed to delete. The file may be in use." };
  }
}
```

- [ ] **Step 2: Write `media-grid.tsx`**

```tsx
"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteMedia } from "./_actions";

export type MediaItem = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaGrid({ locale, media }: { locale: string; media: MediaItem[] }) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = media.filter((m) =>
    !query.trim() || m.originalName.toLowerCase().includes(query.toLowerCase())
  );

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteMedia(id, locale);
      if (result.error) toast.error(result.error);
      else toast.success("Media deleted");
    });
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <Input
          className="h-10 max-w-sm"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by filename..."
          value={query}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{media.length}</span> files
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {filtered.map((item) => (
          <article className="group overflow-hidden rounded-xl border border-border/70 bg-card" key={item.id}>
            <div className="relative aspect-[4/3] bg-muted">
              {item.mimeType.startsWith("image/") ? (
                <Image alt={item.originalName} className="object-cover" fill sizes="240px" src={item.url} />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {item.mimeType.split("/")[1]?.toUpperCase() ?? "FILE"}
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="line-clamp-1 text-xs font-medium" title={item.originalName}>{item.originalName}</p>
              <p className="text-[11px] text-muted-foreground">{formatBytes(item.size)}</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="mt-2 h-7 w-full text-xs" disabled={isPending} size="sm" variant="destructive">
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete file?</AlertDialogTitle>
                    <AlertDialogDescription>
                      "{item.originalName}" will be permanently deleted. Events or posts referencing this file will lose their image.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `media/page.tsx`**

```tsx
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { MediaGrid, type MediaItem } from "./media-grid";

export default async function MediaDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const media = await db.media.findMany({ orderBy: { createdAt: "desc" } });

  const items: MediaItem[] = media.map((m) => ({
    id: m.id,
    url: m.url,
    originalName: m.originalName,
    mimeType: m.mimeType,
    size: m.size,
    createdAt: m.createdAt,
  }));

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">Media Library</h1>
      </div>
      <MediaGrid locale={activeLocale} media={items} />
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\[locale\]/dashboard/media/
git commit -m "feat: media dashboard — grid with delete AlertDialog"
```

---

## Task 15: Menus Dashboard — Editable Menu Items

**Files:**
- Create: `src/app/[locale]/dashboard/menus/_actions.ts`
- Modify: `src/app/[locale]/dashboard/menus/page.tsx`
- Modify: `src/app/[locale]/dashboard/menus/menu-item-list.tsx`

- [ ] **Step 1: Create `_actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function createMenuItem(
  menuId: string,
  url: string,
  labelEn: string,
  labelAr: string,
  order: number,
  locale: string,
): Promise<{ error?: string }> {
  if (!url || !labelEn || !labelAr) return { error: "URL and labels required" };
  try {
    await db.menuItem.create({
      data: {
        menuId,
        url,
        type: "link",
        order,
        translations: {
          create: [
            { locale: "en", label: labelEn },
            { locale: "ar", label: labelAr },
          ],
        },
      },
    });
    revalidatePath(`/${locale}/dashboard/menus`);
    return {};
  } catch {
    return { error: "Failed to create menu item" };
  }
}

export async function deleteMenuItem(id: string, locale: string): Promise<{ error?: string }> {
  try {
    await db.menuItem.delete({ where: { id } });
    revalidatePath(`/${locale}/dashboard/menus`);
    return {};
  } catch {
    return { error: "Failed to delete item" };
  }
}
```

- [ ] **Step 2: Rewrite `menu-item-list.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMenuItem, deleteMenuItem } from "./_actions";

export type MenuItemRow = {
  id: string;
  url: string | null;
  labelEn: string;
  labelAr: string;
  order: number;
};

export function MenuItemList({
  items,
  locale,
  menuId,
}: {
  items: MenuItemRow[];
  locale: string;
  menuId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ url: "", labelEn: "", labelAr: "" });

  function handleCreate() {
    startTransition(async () => {
      const result = await createMenuItem(menuId, form.url, form.labelEn, form.labelAr, items.length, locale);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Item added");
        setForm({ url: "", labelEn: "", labelAr: "" });
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteMenuItem(id, locale);
      if (result.error) toast.error(result.error);
      else toast.success("Item removed");
    });
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4 space-y-2">
        {items.map((item) => (
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/10 px-3 py-2" key={item.id}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{item.labelEn} / {item.labelAr}</p>
              <p className="text-xs text-muted-foreground">{item.url}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isPending} size="sm" variant="destructive">Remove</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove "{item.labelEn}"?</AlertDialogTitle>
                  <AlertDialogDescription>This link will be removed from the menu.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(item.id)}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input onChange={(e) => setForm((f) => ({ ...f, labelEn: e.target.value }))} placeholder="Label (EN)" value={form.labelEn} />
        <Input onChange={(e) => setForm((f) => ({ ...f, labelAr: e.target.value }))} placeholder="Label (AR)" value={form.labelAr} />
        <Input onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="URL (e.g. /en/about)" value={form.url} />
      </div>
      <Button className="mt-3" disabled={isPending || !form.url || !form.labelEn} onClick={handleCreate} size="sm">
        Add Item
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Update `menus/page.tsx`**

```tsx
import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";
import { MenuItemList, type MenuItemRow } from "./menu-item-list";

export default async function MenusDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  const menus = await db.menu.findMany({
    include: {
      items: {
        include: { translations: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { location: "asc" },
  });

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h1 className="text-2xl font-semibold">Menus</h1>
      </div>
      {menus.map((menu) => {
        const items: MenuItemRow[] = menu.items.map((item) => ({
          id: item.id,
          url: item.url,
          labelEn: item.translations.find((t) => t.locale === "en")?.label ?? "",
          labelAr: item.translations.find((t) => t.locale === "ar")?.label ?? "",
          order: item.order,
        }));
        return (
          <div key={menu.id}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{menu.location}</h2>
            <MenuItemList items={items} locale={activeLocale} menuId={menu.id} />
          </div>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 4: Final build check**

```bash
pnpm build 2>&1 | tail -30
```

Expected: successful build, zero TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\[locale\]/dashboard/menus/
git commit -m "feat: menus dashboard — editable menu items with add/remove"
```

---

## Self-Review

**Spec coverage:**
- Task 1: event card inset-0 ✓
- Task 2: rich text rendering ✓
- Task 3: locale switcher ✓
- Task 4: nav from DB ✓
- Task 5: schema migration ✓
- Task 6: shadcn sidebar ✓
- Task 7: events edit + EventForm ✓
- Task 8: events new + EventForm ✓
- Task 9: registrations list production ✓
- Task 10: per-event registrations production ✓
- Task 11: posts table + form ✓
- Task 12: categories CRUD ✓
- Task 13: users table + role management ✓
- Task 14: media delete ✓
- Task 15: menus editable ✓

**Known constraint:** Task 5 (migration) must run before Task 7/8 (EventForm saves `showMapEmbed`/`googleMapsLink`). The `updateEventAction` casts `event` as `{ showMapEmbed?: boolean }` as a workaround until migration runs, but the actual DB write will fail without the migration. Run Task 5 first.

**Type note:** `EventTranslation.description` is `Json?` in Prisma, but we pass HTML strings. Prisma stores strings as JSON string values — this is valid. When reading back in the public page, `typeof trEn?.description === "string"` handles it correctly.
