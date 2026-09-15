# Kayan Training & Consulting — Platform Design Spec
**Date:** 2026-04-28
**Status:** Approved by user — ready for implementation planning
**Sub-project:** Foundation + Full Platform (minus visual page builder)

---

## 1. Overview

Production-grade multilingual (Arabic-first) Next.js platform for Kayan Training & Consulting (Oman). Replaces static HTML prototype with a fully dynamic CMS-backed site including event management, registrations, payments, knowledge hub, and admin dashboard.

**Visual identity:** 1:1 match with `.source/` HTML prototype — "Architectural Curator" editorial dark theme.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | RSC, generateMetadata, generateStaticParams |
| Styling | Tailwind v4 + CSS custom properties | Design tokens as OKLCH CSS vars |
| ORM | Prisma + `@prisma/adapter-neon` | Neon serverless connection pooling |
| Database | Neon.tech (PostgreSQL) | Free tier |
| Auth | better-auth (email/password + Google OAuth) | Admin plugin for roles |
| i18n | Next.js native App Router pattern | proxy.ts + `app/[locale]/` + JSON dictionaries |
| Email | Nodemailer (SMTP) | Generic SMTP transport, plug in any provider |
| Media | AWS S3 + Next.js Image | Direct S3 upload via presigned URLs |
| Validation | Zod + React Hook Form | Type-safe forms |
| Rich Text | TipTap (ProseMirror JSON) | WYSIWYG editor in admin, read-only renderer on public |
| Deployment | Vercel (free tier) | |

---

## 3. Project Structure

```
src/
├── proxy.ts                        # locale redirect + admin auth guard (replaces middleware.ts — Next.js 16)
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # <html lang dir>, generateStaticParams([ar, en])
│   │   ├── dictionaries.ts         # getDictionary, hasLocale
│   │   ├── page.tsx                # home — 1:1 source match
│   │   ├── events/
│   │   │   ├── page.tsx            # events listing with filter
│   │   │   └── [slug]/
│   │   │       ├── page.tsx        # event detail (single + featured variant)
│   │   │       └── register/
│   │   │           └── page.tsx    # multi-step registration form
│   │   ├── posts/
│   │   │   ├── page.tsx            # knowledge hub listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # post detail
│   │   ├── auth/
│   │   │   └── [[...path]]/
│   │   │       └── page.tsx        # login / register / forgot / reset
│   │   └── dashboard/              # admin — role=admin required
│   │       ├── layout.tsx          # dark sidebar layout
│   │       ├── page.tsx            # overview stats
│   │       ├── events/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/page.tsx   # edit: locales tab, schedule, trainers, form fields, payment
│   │       ├── posts/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── registrations/
│   │       │   ├── page.tsx        # all registrations
│   │       │   └── [eventId]/
│   │       │       └── page.tsx    # per-event + export + payment verification
│   │       ├── pages/
│   │       │   └── [slug]/page.tsx # static page content editing
│   │       ├── menus/
│   │       │   └── page.tsx        # nav menu builder
│   │       ├── media/
│   │       │   └── page.tsx        # media library
│   │       ├── categories/
│   │       │   └── page.tsx        # departments/categories management
│   │       ├── users/
│   │       │   └── page.tsx        # user list + role management
│   │       └── settings/
│   │           └── page.tsx        # site settings, payment config
│   └── api/
│       ├── auth/[...all]/          # better-auth handler
│       ├── media/
│       │   └── upload/
│       │       └── presign/route.ts # S3 presigned URL generation
│       └── admin/
│           └── exports/
│               └── registrations/route.ts # CSV export
├── messages/
│   ├── ar.json                     # default locale strings
│   └── en.json
├── components/
│   ├── layout/
│   │   ├── nav.tsx                 # glassmorphism nav, RTL/LTR aware
│   │   ├── footer.tsx
│   │   └── admin-sidebar.tsx
│   ├── i18n/
│   │   └── locale-switcher.tsx
│   └── ui/                         # design system primitives
├── lib/
│   ├── db.ts                       # Prisma singleton + Neon adapter
│   ├── auth.ts                     # better-auth server config
│   ├── auth-client.ts              # better-auth client config
│   ├── session.ts                  # getServerSession helper
│   └── email/
│       ├── client.ts               # Resend singleton
│       └── templates/              # React Email components
└── styles/
    └── globals.css                 # Tailwind v4 + OKLCH design tokens
```

---

## 4. i18n Architecture

**Strategy:** Next.js native App Router pattern (documented at nextjs.org/docs/app/guides/internationalization)

- **Default locale:** `ar` (Arabic, RTL)
- **Secondary locale:** `en` (English, LTR)
- **URL structure:** `/ar/...` and `/en/...`. Root `/` redirects to `/ar/`
- **`proxy.ts`** detects locale from: URL prefix → `preferred_locale` cookie → `Accept-Language` header → default `ar`
- **Dictionary files:** `messages/ar.json` and `messages/en.json` (JSON, loaded server-side only via `getDictionary`)
- **`generateStaticParams`** in `[locale]/layout.tsx` returns `[{ locale: 'ar' }, { locale: 'en' }]`
- **`<html>` attributes:** `lang={locale}` and `dir={locale === 'ar' ? 'rtl' : 'ltr'}`
- **Locale persistence:** Server action saves to `preferred_locale` cookie (1 year) + `user.preferredLocale` if authenticated
- **hreflang:** Injected via `generateMetadata` `alternates.languages` on every public page

---

## 5. Design System

### Colors (Tailwind v4 OKLCH)

> Note: Values are approximate hex→OKLCH conversions. Verify with https://oklch.com before finalizing.

```css
@theme {
  --color-primary:                   oklch(0.80 0.048 212);   /* #a3cddb steel blue */
  --color-secondary:                 oklch(0.82 0.088 183);   /* #79d7c4 mint teal */
  --color-background:                oklch(0.09 0.004 195);   /* #121414 */
  --color-surface:                   oklch(0.09 0.004 195);
  --color-surface-dim:               oklch(0.07 0.003 195);   /* #0d0f0f */
  --color-surface-container-lowest:  oklch(0.07 0.003 195);
  --color-surface-container-low:     oklch(0.12 0.003 195);   /* #1a1c1c */
  --color-surface-container:         oklch(0.14 0.003 195);   /* #1e2020 */
  --color-surface-container-high:    oklch(0.18 0.004 195);   /* #282a2a */
  --color-surface-container-highest: oklch(0.23 0.004 195);   /* #333535 */
  --color-surface-bright:            oklch(0.25 0.003 195);   /* #383939 */
  --color-on-surface:                oklch(0.90 0.003 195);   /* #e2e2e2 */
  --color-on-surface-variant:        oklch(0.81 0.014 207);   /* #c1c8ca */
  --color-primary-container:         oklch(0.28 0.048 212);   /* #17434e */
  --color-on-primary-container:      oklch(0.71 0.038 212);   /* #86afbc */
  --color-secondary-container:       oklch(0.47 0.088 183);   /* #027b6c */
  --color-on-secondary-container:    oklch(0.95 0.060 183);   /* #b2ffee */
  --color-outline:                   oklch(0.61 0.012 207);   /* #8b9295 */
  --color-outline-variant:           oklch(0.32 0.012 207);   /* #41484a */
}
```

### Typography — Locale-Aware

All fonts loaded via `next/font/google`. CSS vars swapped per locale in `[locale]/layout.tsx`.

| Locale | Headings (h1–h4) | Body / Labels | Mono |
|---|---|---|---|
| `ar` | IBM Plex Sans Arabic (600–700) | Alexandria (300–700) | DM Mono |
| `en` | Montserrat (700–900) | Montserrat (400–600) | DM Mono |

```css
@theme {
  --font-heading: /* set per locale via layout className */;
  --font-body:    /* set per locale via layout className */;
  --font-mono:    "DM Mono", monospace;
}
```

### Design Rules (from DESIGN.md)
- **Zero border radius** on all elements (`--radius: 0px`). Exception: `border-radius: 9999px` for pills only.
- **No 1px solid borders** for section division — use background surface hierarchy shifts instead.
- **Ghost borders** where required: `border: 1px solid oklch(0.32 0.012 207 / 15%)`
- **Glassmorphism** on nav + floating panels: `background: oklch(0.09 0.004 195 / 60%)`, `backdrop-filter: blur(20px)`
- **Ambient shadows only:** blur 40–80px, opacity 4–8%
- **Logical CSS properties** throughout (`start/end` not `left/right`) for RTL correctness

---

## 6. Database Schema

### better-auth tables (auto-generated)
`user`, `session`, `account`, `verification` — generated by `npx @better-auth/cli migrate`

Admin plugin adds to `user`: `role`, `banned`, `banReason`, `banExpires`

Custom `preferredLocale` field added to `user` model in Prisma schema.

### Custom Tables

```prisma
model Category {
  id          String   @id @default(cuid())
  slug        String   @unique
  icon        String   // inline SVG string
  color       String   // oklch string e.g. "oklch(0.80 0.09 183)"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  translations    CategoryTranslation[]
  eventCategories EventCategory[]
  postCategories  PostCategory[]
}

model CategoryTranslation {
  id          String   @id @default(cuid())
  categoryId  String
  locale      String   // "ar" | "en"
  name        String
  description String?
  category    Category @relation(fields: [categoryId], references: [id])
  @@unique([categoryId, locale])
}

model Media {
  id           String   @id @default(cuid())
  filename     String
  originalName String
  url          String
  mimeType     String
  size         Int
  width        Int?
  height       Int?
  uploadedById String
  createdAt    DateTime @default(now())
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
}

model Event {
  id                  String    @id @default(cuid())
  slug                String    @unique
  status              String    @default("draft")  // draft|published|archived
  type                String    // training|evening|consulting|forum|academy
  location            String?
  featuredImageId     String?
  startDate           DateTime
  endDate             DateTime
  price               Decimal   @default(0)
  isFree              Boolean   @default(false)
  paymentMethods      String    @default("both")   // online|bank|both
  bankTransferDetails Json?     // {accountName, iban, bankName, notes}
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  featuredImage       Media?              @relation(fields: [featuredImageId], references: [id])
  translations        EventTranslation[]
  trainers            EventTrainer[]
  scheduleItems       EventScheduleItem[]
  formFields          RegistrationFormField[]
  registrations       Registration[]
  categories          EventCategory[]
}

model EventTranslation {
  id               String  @id @default(cuid())
  eventId          String
  locale           String
  title            String
  shortDescription String?
  description      Json?   // TipTap ProseMirror JSON
  event            Event   @relation(fields: [eventId], references: [id])
  @@unique([eventId, locale])
}

model Trainer {
  id        String   @id @default(cuid())
  avatarId  String?
  email     String?
  createdAt DateTime @default(now())

  avatar          Media?              @relation(fields: [avatarId], references: [id])
  translations    TrainerTranslation[]
  eventTrainers   EventTrainer[]
  scheduleItems   EventScheduleItem[]
}

model TrainerTranslation {
  id        String  @id @default(cuid())
  trainerId String
  locale    String
  name      String
  title     String?
  bio       String?
  trainer   Trainer @relation(fields: [trainerId], references: [id])
  @@unique([trainerId, locale])
}

model EventTrainer {
  id        String  @id @default(cuid())
  eventId   String
  trainerId String
  role      String?
  event     Event   @relation(fields: [eventId], references: [id])
  trainer   Trainer @relation(fields: [trainerId], references: [id])
  @@unique([eventId, trainerId])
}

model EventScheduleItem {
  id        String   @id @default(cuid())
  eventId   String
  startTime DateTime
  endTime   DateTime
  order     Int
  speakerId String?
  event     Event    @relation(fields: [eventId], references: [id])
  speaker   Trainer? @relation(fields: [speakerId], references: [id])

  translations EventScheduleItemTranslation[]
}

model EventScheduleItemTranslation {
  id             String            @id @default(cuid())
  scheduleItemId String
  locale         String
  title          String
  description    String?
  scheduleItem   EventScheduleItem @relation(fields: [scheduleItemId], references: [id])
  @@unique([scheduleItemId, locale])
}

model RegistrationFormField {
  id       String  @id @default(cuid())
  eventId  String
  type     String  // text|email|tel|select|checkbox|textarea
  required Boolean @default(false)
  order    Int
  options  Json?   // string[] for select fields
  event    Event   @relation(fields: [eventId], references: [id])

  translations RegistrationFormFieldTranslation[]
}

model RegistrationFormFieldTranslation {
  id          String                @id @default(cuid())
  fieldId     String
  locale      String
  label       String
  placeholder String?
  field       RegistrationFormField @relation(fields: [fieldId], references: [id])
  @@unique([fieldId, locale])
}

model Registration {
  id            String   @id @default(cuid())
  eventId       String
  userId        String?
  formData      Json     // { [fieldId]: value }
  paymentStatus String   @default("pending")  // pending|paid|failed|refunded
  paymentMethod String   // online|bank_transfer
  amount        Decimal
  createdAt     DateTime @default(now())

  event    Event    @relation(fields: [eventId], references: [id])
  user     User?    @relation(fields: [userId], references: [id])
  payment  Payment?
}

model Payment {
  id             String    @id @default(cuid())
  registrationId String    @unique
  method         String    // online|bank_transfer
  status         String    @default("pending")  // pending|verified|rejected
  reference      String?
  proofUrl       String?   // bank transfer proof upload
  verifiedById   String?
  verifiedAt     DateTime?
  createdAt      DateTime  @default(now())

  registration Registration @relation(fields: [registrationId], references: [id])
  verifiedBy   User?        @relation(fields: [verifiedById], references: [id])
}

model Post {
  id              String   @id @default(cuid())
  slug            String   @unique
  status          String   @default("draft")  // draft|published
  type            String   @default("article") // article|whitepaper|analysis
  featuredImageId String?
  authorId        String
  publishedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  featuredImage Media?            @relation(fields: [featuredImageId], references: [id])
  author        User              @relation(fields: [authorId], references: [id])
  translations  PostTranslation[]
  categories    PostCategory[]
}

model PostTranslation {
  id      String  @id @default(cuid())
  postId  String
  locale  String
  title   String
  excerpt String?
  content Json?   // TipTap ProseMirror JSON
  post    Post    @relation(fields: [postId], references: [id])
  @@unique([postId, locale])
}

model Page {
  id        String   @id @default(cuid())
  slug      String   @unique
  status    String   @default("draft")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  translations PageTranslation[]
}

model PageTranslation {
  id     String  @id @default(cuid())
  pageId String
  locale String
  title  String
  blocks Json?   // ordered block array — reserved for page builder phase
  page   Page    @relation(fields: [pageId], references: [id])
  @@unique([pageId, locale])
}

model Menu {
  id       String     @id @default(cuid())
  location String     @unique  // primary|footer|footer_secondary
  items    MenuItem[]
}

model MenuItem {
  id       String     @id @default(cuid())
  menuId   String
  parentId String?
  order    Int
  type     String     // page|post|event|custom_url
  targetId String?
  url      String?
  menu     Menu       @relation(fields: [menuId], references: [id])
  parent   MenuItem?  @relation("MenuItemChildren", fields: [parentId], references: [id])
  children MenuItem[] @relation("MenuItemChildren")

  translations MenuItemTranslation[]
}

model MenuItemTranslation {
  id         String   @id @default(cuid())
  menuItemId String
  locale     String
  label      String
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id])
  @@unique([menuItemId, locale])
}

model EventCategory {
  eventId    String
  categoryId String
  event      Event    @relation(fields: [eventId], references: [id])
  category   Category @relation(fields: [categoryId], references: [id])
  @@id([eventId, categoryId])
}

model PostCategory {
  postId     String
  categoryId String
  post       Post     @relation(fields: [postId], references: [id])
  category   Category @relation(fields: [categoryId], references: [id])
  @@id([postId, categoryId])
}

model Setting {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt
}
```

**Seed data:** 8 categories from assets (Arts, Education & Psychology, Tech, Media & Communication, Entertainment, Management & Leadership, Lifestyle, Economy) with their corresponding SVG icons.

---

## 7. Auth

### Files
- `lib/auth.ts` — betterAuth server config: Prisma adapter, email/password, Google OAuth, admin plugin
- `lib/auth-client.ts` — createAuthClient with adminClient plugin
- `app/api/auth/[...all]/route.ts` — better-auth handler

### Roles
- `user` — default on sign up
- `admin` — assigned manually via dashboard Users section or admin invite

### Route protection (proxy.ts)
- `/[locale]/dashboard/*` — requires authenticated session with `role === 'admin'`
- Unauthenticated → redirect to `/[locale]/auth`
- Non-admin authenticated → redirect to `/[locale]`

### Auth flows
| Flow | Email sent |
|---|---|
| Sign up (email/password) | Verification email |
| Forgot password | Reset link |
| Admin invite | Invite with temp link |
| Registration confirmed | Registration confirmation |
| Bank transfer pending | Awaiting payment verification |
| Payment verified | Confirmation with details |
| Payment rejected | Rejection with reason |
| Event reminder | Day-before reminder (manual trigger) |

---

## 8. Email (Resend)

- `lib/email/client.ts` — Nodemailer SMTP transport (generic, any SMTP provider)
- `lib/email/templates/` — React Email components, bilingual (ar/en based on user `preferredLocale`)
- Brand-consistent: Kayan colors, typography

---

## 9. Media Pipeline

1. Client requests presigned URL → `POST /api/media/upload/presign`
2. Client uploads directly to S3 (bypasses Vercel 4.5MB limit)
3. Client confirms → server saves `Media` record
4. Public images served via `next/image` → Vercel auto-converts to AVIF/WebP
5. Videos stored as-is in S3, rendered with `<video preload="none">` + poster

**Accepted:** `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/svg+xml`, `video/mp4`, `application/pdf`
**Max size:** 50MB

---

## 10. SEO

- `generateMetadata` on every public page: title, description, OG image, canonical, hreflang alternates
- `app/sitemap.ts` — dynamic sitemap from DB (published events, posts, pages)
- `app/robots.ts` — blocks `/dashboard`, allows all public routes
- Events: JSON-LD `Event` schema for Google rich results
- Posts: JSON-LD `Article` schema
- `generateStaticParams` on events + posts for static generation at build

---

## 11. Admin Dashboard

Dark sidebar layout matching Kayan design system.

### Sections
| Section | Key features |
|---|---|
| Overview | Stats: total events, registrations, revenue, recent activity |
| Events | List/filter, new/edit with TipTap WYSIWYG, locale tabs (AR/EN), trainer attach, schedule builder, registration form field builder (drag reorder, field types), payment method config |
| Posts | List/filter, new/edit with TipTap WYSIWYG, locale tabs, category attach, SEO meta override |
| Registrations | Filter by event/status/payment method, view form answers, manual bank transfer verification + proof image viewer, CSV export (column selector — wishlist) |
| Pages | Static page content editing with locale tabs |
| Menus | Add items (page/post/event/custom URL), drag reorder, 1-level nesting, locale label per item |
| Media | Grid view, upload, delete, copy URL, filter by MIME type |
| Categories | Name (ar/en), OKLCH color picker, SVG icon upload/paste |
| Users | User list, assign/revoke admin role |
| Settings | Site name, contact info, social links, bank transfer details, payment gateway config |

### Locale editing pattern
- Every content edit form (event, post, page) has **AR / EN tab switcher** at top
- Locale-independent fields (dates, price, status, images) shown once outside tabs
- Locale-dependent fields (title, description, etc.) inside tabs
- Unsaved changes warning on tab switch

---

## 12. Public Pages

All pages 1:1 match with `.source/` HTML prototype.

| Route | Page | Notes |
|---|---|---|
| `/[locale]` | Home | Hero, pillars, values, events carousel (DB), knowledge hub (DB), CTA |
| `/[locale]/events` | Events listing | Filter by category/type, search |
| `/[locale]/events/[slug]` | Event detail | Featured variant if `type=featured`, JSON-LD |
| `/[locale]/events/[slug]/register` | Registration | Multi-step form (user-defined fields), payment step |
| `/[locale]/posts` | Knowledge hub | Filter by type/category |
| `/[locale]/posts/[slug]` | Post detail | TipTap renderer, JSON-LD |
| `/[locale]/auth` | Auth | Sign in, sign up, forgot, reset |

---

## 13. Open Questions / Future Phases

- **Page builder** (visual block editing) — separate sub-project, `blocks` JSON field in `PageTranslation` reserved
- **Online payment gateway** — Thawani (Oman) or similar; gateway integration is Phase 2
- **Video transcoding** — Cloudflare Stream or Mux for WebM/HLS; Phase 2
- **Event reminder cron** — Vercel Cron or external trigger; Phase 2

---

## 14. Environment Variables Required

```env
# Database
DATABASE_URL=               # Neon connection string (pooled)
DATABASE_URL_UNPOOLED=      # Neon direct connection (for migrations)

# Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# Email (SMTP via nodemailer)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# App
NEXT_PUBLIC_APP_URL=
```
