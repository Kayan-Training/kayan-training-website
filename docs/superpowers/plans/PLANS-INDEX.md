# Kayan Platform — Implementation Plans Index

This directory contains the phased implementation plans for the Kayan Training platform.
Each plan is self-contained and independently executable. Implement in order.

---

## Plan 1: Dashboard Visual Overhaul (START HERE)
**File:** `2026-04-29-kayan-platform-implementation.md`
**Status:** Ready to execute
**Scope:** Purely the admin dashboard — no new features, just visual/UX overhaul of existing pages.

Covers:
- Install missing packages (`@hookform/resolvers`, `framer-motion`, `sonner`, `date-fns`, `@tiptap/*`, `@dnd-kit/*`, `nodemailer`)
- Add missing shadcn components (`form`, `dropdown-menu`, `alert-dialog`, `tabs`, `sonner`)
- Fix `globals.css` — dark `:root` tokens, zero `--radius`, add `status-*` semantic tokens
- Shared utilities: `src/lib/format.ts`, `src/lib/tone.ts`, `page-header`, `section-card`, `empty-state`, `count-up`
- Dashboard overview page: KPI cards with icons, CountUp animation, recent registrations panel
- Events: client-side search table, tonal badges, row dropdown, RHF+zod Card-sectioned create/edit form
- Posts: same pattern as events
- Registrations: search + payment status filter, tonal badges, human-readable labels
- Categories: Card form with SVG icon paste field and color swatch
- Users: shadcn Select for role, tonal status badges
- Menus: @dnd-kit drag reorder with auto-save

**Dependencies:** None. Run this plan first against the existing codebase.

---

## Plan 2: Full Platform — Foundation, CMS, Events, Public Pages, SEO
**File:** `2026-04-28-kayan-platform-implementation.md`
**Status:** Ready to execute after Plan 1
**Scope:** Everything beyond the dashboard: schema migrations, auth, i18n, TipTap WYSIWYG, event registration/payment flows, S3 media, email (Nodemailer), public-facing pages, SEO.

Covers:
- Project baseline tooling and scripts
- Full Prisma schema migration + seed data
- better-auth (email/password + Google, admin plugin)
- i18n foundation: proxy.ts locale routing, JSON dictionaries, locale-aware layout
- Design system tokens and public layout shell
- TipTap WYSIWYG editor integration into event/post forms
- Event trainers section, schedule builder, registration form field builder
- Bank transfer payment config and proof verification
- S3 presigned upload media library
- Nodemailer SMTP + React Email templates (registration confirmation, bank transfer instructions)
- Public pages: home, events listing, event detail, event registration, posts listing, post detail
- SEO: `generateMetadata`, sitemap.xml, robots.txt, JSON-LD structured data, hreflang

**Dependencies:** Plan 1 must be complete. Packages installed in Plan 1 are consumed here.

---

## Execution Notes for Agents

1. **Always start with Plan 1.** It fixes the CSS token conflicts and installs packages that Plan 2 imports.
2. Each plan task list uses `- [ ]` checkboxes. Mark each step done as you complete it.
3. Run `pnpm typecheck` after each task and fix errors before moving to the next.
4. Commit after every task using the exact commit message provided in that task.
5. If you pick up mid-plan, scan the checkboxes to find the first unchecked step.
6. Server actions that are called from client components must be in files with `"use server"` at the top or declared inline with `"use server"` in the function body — both patterns are used.
7. The codebase is TypeScript strict mode. Do not use `any`.
