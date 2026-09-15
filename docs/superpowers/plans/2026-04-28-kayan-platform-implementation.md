# Plan 2: Kayan Platform Foundation + CMS + Public Pages

> **Plan index:** See [`PLANS-INDEX.md`](./PLANS-INDEX.md) for the full execution order. **This is Plan 2 — requires Plan 1 to be complete first.**
> **Previous plan:** [`2026-04-29-kayan-platform-implementation.md`](./2026-04-29-kayan-platform-implementation.md) (Plan 1: Dashboard Visual Overhaul).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production-ready Arabic-first multilingual Kayan platform on Next.js 16 with dynamic CMS content, admin dashboard, event registration/payment workflows, and SEO-complete public pages while preserving the existing visual identity.

**Architecture:** Implement in vertical slices: platform foundation (tooling, schema, auth, i18n), shared domain services, admin CRUD, then public read flows and registration/payment workflows. Keep locale-dependent content in translation tables and locale-independent data in parent entities. Use server components/actions for reads/mutations where possible, route handlers for integration points, and strict schema validation with Zod at all form boundaries.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, Prisma + Neon adapter, better-auth, Zod, React Hook Form, TipTap, AWS S3 presigned uploads, Nodemailer, pnpm.

**SEO Requirement (Explicit):** Every public route must ship with production-grade metadata: locale-specific `<title>` and `<meta name="description">` derived from page content. Metadata must support CMS/user-controlled overrides (per locale), with deterministic fallback rules when overrides are missing.

---

## Scope Check

This spec spans multiple subsystems (foundation, CMS/admin, public rendering, media, registration/payments, SEO). To reduce risk, implement as the phased tasks below. Each task is independently testable and shippable. If scheduling pressure appears, split into separate plan documents per phase after Task 4.

## File Structure Map

- `prisma/schema.prisma`: full relational model and enums/constants alignment.
- `prisma/seed.ts`: initial categories + icon seed data.
- `src/lib/*`: cross-cutting services (db/auth/session/email/i18n/media helpers).
- `src/proxy.ts`: locale routing + dashboard authorization guard.
- `src/app/[locale]/**`: public + dashboard routes (RSC-first).
- `src/app/api/**`: auth handler, media presign, exports.
- `src/components/**`: design-system and feature components (locale-aware).
- `src/messages/{ar,en}.json`: translation dictionaries.
- `src/styles/globals.css`: design tokens and visual rules.
- `tests/**` and/or `src/**/__tests__/**`: unit/integration coverage for domain logic, route handlers, and key rendering paths.

### Task 1: Project Baseline and Tooling Alignment

**Files:**
- Modify: `package.json`
- Create/Modify: `pnpm-workspace.yaml` (if needed)
- Modify: `README.md`
- Create: `.env.example`

- [ ] **Step 1: Write failing validation check for scripts and package manager assumptions**
Run: `pnpm run lint`
Expected: Missing scripts or baseline mismatch identified.

- [ ] **Step 2: Add/normalize scripts with pnpm-first workflow**
Include: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `prisma:generate`, `prisma:migrate`, `prisma:seed`.

- [ ] **Step 3: Re-run baseline checks**
Run: `pnpm lint && pnpm typecheck`
Expected: PASS (or only known existing failures documented).

- [ ] **Step 4: Commit**
Run: `git add package.json README.md .env.example pnpm-workspace.yaml`
Run: `git commit -m "chore: standardize pnpm workflow and project scripts"`

### Task 2: Database Schema, Migrations, and Seed Data

**Files:**
- Modify: `prisma/schema.prisma`
- Create/Modify: `prisma/seed.ts`
- Create/Modify: `prisma/migrations/*`
- Create: `src/lib/db.ts`

- [ ] **Step 1: Write failing schema consistency checks**
Run: `pnpm prisma:generate`
Expected: FAIL or missing models/relations before changes.

- [ ] **Step 2: Implement full Prisma schema from spec**
Add all tables, relations, unique constraints, and locale translation models exactly as defined. Include metadata override fields for user-controlled SEO where needed (for example locale-level `seoTitle` and `seoDescription` on translatable content models).

- [ ] **Step 3: Add seed for 8 categories with localized names, colors, and SVG icons**
Ensure idempotent seed behavior.

- [ ] **Step 4: Run migration + generation + seed**
Run: `pnpm prisma:migrate`
Run: `pnpm prisma:generate`
Run: `pnpm prisma:seed`
Expected: Migration applied, client generated, seed inserted.

- [ ] **Step 5: Commit**
Run: `git add prisma src/lib/db.ts`
Run: `git commit -m "feat: add kayan domain schema and seed data"`

### Task 3: Auth + Session + Route Protection

**Files:**
- Create/Modify: `src/lib/auth.ts`
- Create/Modify: `src/lib/auth-client.ts`
- Create/Modify: `src/lib/session.ts`
- Create/Modify: `src/app/api/auth/[...all]/route.ts`
- Create/Modify: `src/proxy.ts`

- [ ] **Step 1: Write failing auth route tests and dashboard access tests**
Validate unauthenticated redirect and non-admin redirect behavior.

- [ ] **Step 2: Implement better-auth server/client config with admin plugin**
Include email/password, Google OAuth, role-based admin controls.

- [ ] **Step 3: Implement proxy locale + auth guard logic**
Guard `/[locale]/dashboard/*`, preserve locale-aware redirects.

- [ ] **Step 4: Run targeted tests**
Run: `pnpm test -- auth proxy`
Expected: PASS for auth/guard flows.

- [ ] **Step 5: Commit**
Run: `git add src/lib src/app/api/auth src/proxy.ts`
Run: `git commit -m "feat: implement auth and dashboard route protection"`

### Task 4: i18n Foundation and Locale-Aware Layout

**Files:**
- Create/Modify: `src/app/[locale]/layout.tsx`
- Create/Modify: `src/app/[locale]/dictionaries.ts`
- Create/Modify: `src/messages/ar.json`
- Create/Modify: `src/messages/en.json`
- Create/Modify: `src/components/i18n/locale-switcher.tsx`

- [ ] **Step 1: Write failing tests for locale resolution and dictionary loading**
Validate default `ar`, supported locales, and fallback behavior.

- [ ] **Step 2: Implement locale layout and static params**
Set `lang`, `dir`, locale fonts, and `generateStaticParams` for `ar`/`en`.

- [ ] **Step 3: Add locale switcher persistence hook (cookie + optional user profile update)**
Keep one-year `preferred_locale` cookie.

- [ ] **Step 4: Run tests**
Run: `pnpm test -- i18n locale`
Expected: PASS.

- [ ] **Step 5: Commit**
Run: `git add src/app/[locale] src/messages src/components/i18n`
Run: `git commit -m "feat: add arabic-first i18n foundation"`

### Task 5: Design System and Shared UI Shell

**Files:**
- Modify: `src/styles/globals.css`
- Create/Modify: `src/components/layout/nav.tsx`
- Create/Modify: `src/components/layout/footer.tsx`
- Create/Modify: `src/components/layout/admin-sidebar.tsx`
- Create/Modify: `src/components/ui/*`

- [ ] **Step 1: Write visual regression checklist tests (or Storybook snapshots if available)**
Define checks for zero radius, ghost borders, surface hierarchy, and RTL logical properties.

- [ ] **Step 2: Implement tokens and layout primitives**
Add OKLCH variables, typography variables, glassmorphism/nav styles, sidebar shell.

- [ ] **Step 3: Run lint/type checks**
Run: `pnpm lint && pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**
Run: `git add src/styles src/components/layout src/components/ui`
Run: `git commit -m "feat: implement kayan design tokens and shared shells"`

### Task 6: Media Upload Pipeline (S3 Presign + Media Records)

**Files:**
- Create/Modify: `src/app/api/media/upload/presign/route.ts`
- Create/Modify: `src/lib/media/*`
- Create/Modify: `src/app/[locale]/dashboard/media/page.tsx`

- [ ] **Step 1: Write failing API tests for mime/type/size validation**
Cover accepted MIME list and 50MB limit.

- [ ] **Step 2: Implement presign route and persistence flow**
Generate presigned URL, then store `Media` metadata record.

- [ ] **Step 3: Add admin media page integration**
Upload UI + list/filter + copy URL + delete.

- [ ] **Step 4: Run tests**
Run: `pnpm test -- media presign`
Expected: PASS.

- [ ] **Step 5: Commit**
Run: `git add src/app/api/media src/lib/media src/app/[locale]/dashboard/media`
Run: `git commit -m "feat: add s3 media presign pipeline"`

### Task 7: Admin Content CRUD (Events, Posts, Pages, Categories, Menus, Users, Settings)

**Files:**
- Modify/Create: `src/app/[locale]/dashboard/**`
- Create/Modify: `src/lib/validators/*`
- Create/Modify: `src/lib/services/*`

- [ ] **Step 1: Write failing form and service tests per entity**
Validate locale-tab behavior, required fields, and relation integrity.

- [ ] **Step 2: Implement Events admin (core first)**
Include schedule, trainers, categories, registration fields, payment config.

- [ ] **Step 3: Implement Posts/Pages/Categories/Menus/Users/Settings**
Follow shared form abstractions and role protections.

- [ ] **Step 4: Run targeted suite**
Run: `pnpm test -- dashboard events posts pages menus users settings`
Expected: PASS.

- [ ] **Step 5: Commit**
Run: `git add src/app/[locale]/dashboard src/lib/validators src/lib/services`
Run: `git commit -m "feat: implement admin cms and settings workflows"`

### Task 8: Public Pages and Dynamic Data Rendering

**Files:**
- Modify/Create: `src/app/[locale]/page.tsx`
- Modify/Create: `src/app/[locale]/events/**`
- Modify/Create: `src/app/[locale]/posts/**`
- Create/Modify: `src/components/features/*`

- [ ] **Step 1: Write failing rendering tests for event/post listings and details**
Cover locale content selection and published-only visibility.

- [ ] **Step 2: Implement home/events/posts/detail routes**
Match `.source/` visual structure and dynamic data wiring.

- [ ] **Step 3: Add JSON-LD for Event and Article pages**
Ensure localized metadata values.

- [ ] **Step 4: Run tests**
Run: `pnpm test -- public events posts seo`
Expected: PASS.

- [ ] **Step 5: Commit**
Run: `git add src/app/[locale] src/components/features`
Run: `git commit -m "feat: add dynamic public pages for events and knowledge hub"`

### Task 9: Registration and Payment Verification Workflow

**Files:**
- Modify/Create: `src/app/[locale]/events/[slug]/register/page.tsx`
- Modify/Create: `src/app/[locale]/dashboard/registrations/**`
- Create/Modify: `src/lib/payments/*`
- Create/Modify: `src/lib/registrations/*`

- [ ] **Step 1: Write failing tests for multi-step registration and payment state transitions**
Cover pending/paid/failed/refunded and bank-transfer verification states.

- [ ] **Step 2: Implement public registration multi-step form**
Use dynamic form fields from DB + method-specific payment step.

- [ ] **Step 3: Implement admin verification and CSV export route integration**
Include proof viewing and status mutation auditability.

- [ ] **Step 4: Run tests**
Run: `pnpm test -- registration payment export`
Expected: PASS.

- [ ] **Step 5: Commit**
Run: `git add src/app/[locale]/events/[slug]/register src/app/[locale]/dashboard/registrations src/lib/payments src/lib/registrations`
Run: `git commit -m "feat: implement registration and bank-transfer verification flow"`

### Task 10: Email Templates and Notification Wiring

**Files:**
- Create/Modify: `src/lib/email/client.ts`
- Create/Modify: `src/lib/email/templates/*`
- Create/Modify: `src/lib/notifications/*`

- [ ] **Step 1: Write failing tests for email template rendering and locale selection**
Cover verification, reset, registration confirmation, payment updates.

- [ ] **Step 2: Implement SMTP client and bilingual templates**
Use preferred locale with Arabic fallback.

- [ ] **Step 3: Wire notification triggers into auth/registration/payment flows**
Ensure idempotent send behavior for retries.

- [ ] **Step 4: Run tests**
Run: `pnpm test -- email notification`
Expected: PASS.

- [ ] **Step 5: Commit**
Run: `git add src/lib/email src/lib/notifications`
Run: `git commit -m "feat: add transactional email notifications"`

### Task 11: SEO, Sitemap, Robots, and Metadata Completeness

**Mandatory acceptance for this task:**
- Every public page returns a non-empty localized title and description.
- Metadata defaults are content-derived (not generic placeholders).
- Admin/CMS-provided SEO overrides take precedence over generated defaults per locale.
- Canonical and hreflang are present for all locale variants.

**Files:**
- Create/Modify: `src/app/sitemap.ts`
- Create/Modify: `src/app/robots.ts`
- Modify: `src/app/[locale]/**/page.tsx` (metadata hooks)

- [ ] **Step 1: Write failing tests for sitemap entries and robots policy**
Validate dashboard blocking and published-content inclusion.

- [ ] **Step 2: Implement metadata + hreflang + canonical coverage**
Apply `generateMetadata` for all public pages.

- [ ] **Step 3: Implement dynamic sitemap and robots**
Source from DB and locale routes.

- [ ] **Step 4: Run tests**
Run: `pnpm test -- seo sitemap robots`
Expected: PASS.

- [ ] **Step 5: Commit**
Run: `git add src/app/sitemap.ts src/app/robots.ts src/app/[locale]`
Run: `git commit -m "feat: add seo metadata, sitemap, and robots"`

### Task 12: Hardening, QA, and Production Readiness

**Files:**
- Modify: `README.md`
- Modify/Create: `docs/**` deployment/runbooks
- Modify: CI workflow files (if present)

- [ ] **Step 1: Add integration smoke tests for critical journeys**
Journeys: auth, dashboard access, media upload, event registration, payment verification.

- [ ] **Step 2: Run full quality gates**
Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: all PASS.

- [ ] **Step 3: Validate environment variable completeness**
Cross-check `.env.example` against spec list and runtime needs.

- [ ] **Step 4: Final docs update**
Document setup, migration/seed flow, and deployment checklist.

- [ ] **Step 5: Commit**
Run: `git add README.md docs .env.example`
Run: `git commit -m "chore: finalize qa gates and deployment documentation"`

---

## Test Strategy Summary

- Unit tests: validators, locale helpers, auth/permission guards, service-layer mutations.
- Integration tests: route handlers (`auth`, `media presign`, `exports`) and DB-backed domain operations.
- UI/component tests: locale tabs, multi-step registration behavior, admin CRUD forms.
- End-to-end smoke (recommended): public browse -> register -> admin verify payment.

## Execution Notes

- Use `pnpm` for all package management and script execution.
- Prefer small PRs aligned to task boundaries above.
- Keep locale logic centralized; avoid hardcoded Arabic/English branching in leaf components.
- Defer page-builder and online gateway integrations (Phase 2), but keep extension points explicit.

