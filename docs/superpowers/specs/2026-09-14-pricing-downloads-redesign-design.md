# Pricing cards redesign + multi-item downloads — design

Status: approved by user, pending spec review
Date: 2026-09-14
Driven by: user feedback on the shipped price-tiers/contact-numbers/brochure feature
(real screenshots reviewed) — admin Pricing section layout is wrong, public pricing
cards look generic/bad, brochure needs to become multiple downloadable items, the
Omani Rial glyph is the wrong weight, and the pricing section is buried too low on
the page.

## Problem

The just-shipped feature (spec: `2026-09-14-event-pricing-contact-brochure-design.md`)
has four real defects surfaced by the user's own screenshots of the live admin/public
pages:

1. The brochure upload control lives inside the admin's §04 Pricing section — wrong
   home, and doesn't scale to more than one file.
2. The public pricing cards (`PricingSection` in both `events/[slug]/page.tsx` and
   `training-courses/[slug]/page.tsx`) use a flat `ghost-border bg-surface-container-highest`
   box with no accent, no icon, no hover state — visually disconnected from the rest
   of this site's dark-editorial design language (hairline borders, square corners,
   tinted icon chips, teal/mint accents, grayscale-to-color hover reveals).
3. The "Delegate Enrollment Fees" heading is a hardcoded literal string.
4. The Omani Rial glyph (`currency-symbol.tsx`) was extracted from the CBO's official
   asset at the "Medium" weight, which reads as too thin against this site's bold,
   heavy-weight typography.
5. The pricing cards section sits after "Training Areas", far down the page —
   pricing is a top purchase-decision factor and should be closer to the fold.

## Goals

1. Replace the single `brochureUrl` scalar with a real `EventDownload` list model
   (bilingual label, file, auto-detected icon by mime type), rendered publicly as a
   small accordion behind one "Downloads" sidebar button.
2. Move the downloads admin UI to its own "Downloads" section in the admin nav rail
   (not nested in Pricing).
3. Redesign the public pricing cards to match this site's actual established visual
   language (icon-chip, hairline border, square corners, accent tint, hover lift) —
   no shadows, no rounded corners, consistent with `globals.css`'s tokens and the
   homepage's Training Domains / accreditation card patterns.
4. Make the pricing section's heading an editable bilingual per-event field,
   defaulting to "Pricing" / "الأسعار" when blank.
5. Re-extract the Omani Rial glyph at the **Bold** weight (not Medium) from the same
   official CBO asset bundle, keeping the same extraction method/provenance.
6. Move the pricing cards section from its current position (after Training Areas)
   to just above the page's bottom Register/CTA section.

## Non-goals

- No admin-facing icon picker for downloads — icon is inferred from the uploaded
  file's mime type, not chosen manually.
- No new file types beyond what `S3_ALLOWED_MIME_TYPES` already allows
  (jpeg/png/webp/avif/svg/mp4/webm/pdf) — if the user later needs `.docx`/`.xlsx`
  downloads, that's a separate follow-up (extending the S3 allow-list is out of
  scope here since nothing in this request asked for it).
- No generic reusable `<Accordion>` design-system component — a minimal
  purpose-built `<details>`-based disclosure for this one use case, since no
  accordion primitive exists anywhere in this codebase yet and building a full
  reusable one is unrequested scope.
- Not touching the admin form's own light "SaaS-admin" visual style (`rounded-xl
  border-zinc-200`) — that's a different, intentionally different-looking surface
  from the dark public frontend, and this redesign only targets the public-facing
  pricing cards.

## Data model changes (`prisma/schema.prisma`)

New model, replacing `Event.brochureUrl`:

```prisma
model EventDownload {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  fileUrl   String
  mimeType  String
  labelEn   String
  labelAr   String
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([eventId])
}
```

`Event` changes:
- Remove `brochureUrl String?` (data migrated first, see Rollout).
- Add relation `downloads EventDownload[]`.
- Add `pricingHeadingEn String?` and `pricingHeadingAr String?`.

Migration is NOT purely additive this time (a column is dropped) — this is a
deliberate, reviewed departure from the prior spec's additive-only convention,
justified because: (a) the only existing data in that column (`opex-2026`'s
brochure) is migrated into the new model first, in the same maintenance window,
not left to bit-rot; (b) keeping both `brochureUrl` and `EventDownload` around
would create two competing sources of truth for "the event's downloadable file(s)"
with no clear precedence rule, which is worse than a one-time migration.

## Admin UI

**New "Downloads" section** (`event-form.tsx`, `event-form-visibility.ts`,
`event-form-rail.ts`):
- `EventFormSectionId` gains `"downloads"`.
- Nav rail entry: `{ icon: Download, id: "downloads", label: "Downloads" }` (Download
  already imported from `lucide-react`, unused elsewhere) — appended to the
  `"experience"` rail group (`content, gallery, agenda, downloads`).
- Section content: a `useFieldArray`-based repeatable list (same pattern as Price
  Tiers/Contact Numbers), each row: label EN, label AR, file upload (reusing the
  existing `uploadMediaFile()`/presign pipeline, generalized from the old
  brochure-specific uploader — accepts any of `S3_ALLOWED_MIME_TYPES`, not just
  PDF), shows the uploaded filename once set, Replace/Remove, reorder/delete.
- The old Brochure (PDF) block is removed entirely from §04 Pricing.
- `event-form-health.ts` gets a `downloads` completion-status branch mirroring
  `gallery`'s (optional section, no blocking-error state — 0 downloads is valid).

**Pricing section heading field**: a small bilingual text-input pair (labelled
"Pricing section heading") added to §04 Pricing, wired to
`pricingHeadingEn`/`pricingHeadingAr`, both optional.

## Query layer (`src/lib/content/queries.ts`)

`getEventDetailBySlug` changes:
- `include` gains `downloads: { orderBy: { order: "asc" } }` (replacing nothing —
  `brochureUrl` was a plain scalar, just removed from the returned object).
- New resolved field: `downloads: { id, fileUrl, mimeType, label }[]` — label
  picked by locale (`labelEn`/`labelAr`), same no-cross-locale-fallback rule as
  `EventContactNumber` (if a label is only set in one locale, no cross-locale
  fallback — but unlike contact numbers, label is REQUIRED at the admin layer for
  downloads, so this edge case shouldn't occur in practice; still handle it the
  same way defensively).
- `pricingHeading: string` resolved as `(locale === "ar" ? event.pricingHeadingAr :
  event.pricingHeadingEn) || (locale === "ar" ? "الأسعار" : "Pricing")`.
- Remove `brochureUrl` from the returned object.

## Public rendering

**Icon-by-mimetype helper** (new small pure function, e.g.
`src/lib/downloads/icon-for-mime.ts`): maps `mimeType` to a Hugeicons export —
`application/pdf` → `Pdf02Icon`, `image/*` → `Image02Icon`, else → `File02Icon`.
Used both by the public downloads accordion and optionally the admin list (admin
uses lucide-react conventions instead — a small admin-side equivalent mapping using
lucide's `FileText`/`Image`/`File` icons, kept separate per the file's existing
icon-library convention rather than cross-importing hugeicons into the dashboard).

**Downloads accordion** (sidebar, `RegisterCard`, both `events/[slug]/page.tsx` and
`training-courses/[slug]/page.tsx`): replaces the old single "Download Brochure"
link. Rendered only when `event.downloads.length > 0`. A single toggle button
("Downloads" label + a download icon) expands a native `<details>`/`<summary>`-based
list (client component, since it needs open/close state matching the site's existing
component conventions — check whether a plain `<details>` suffices state-wise before
reaching for `useState`); each row: mime-type icon + label, wrapped in
`<a href={fileUrl} download>`. Matches `ghost-border` styling for the container,
consistent with the rest of the sidebar.

**Pricing cards redesign** (`PricingSection`, both page files): rebuilt using the
site's established language pulled directly from the homepage's Training
Domains/accreditation patterns:
- Square corners (no `rounded-*`, matching the site-wide `--radius: 0`).
- Each card: a tinted icon-chip header (`border-secondary/40 bg-secondary/15
  text-secondary`, generic pricing/ticket icon), title in the site's heading
  treatment, price row using `<CurrencySymbol>` + `font-mono` price in
  `text-secondary` (matching the accreditation block's numeral treatment) with the
  secondary display price muted alongside it, description in
  `text-on-surface-variant`.
- Hairline `border border-outline-variant/20` container, hover state
  `transition-all duration-300 hover:-translate-y-1 hover:border-secondary/40`
  (matching the event-card hover pattern), no box-shadow anywhere.
- A tier may be marked "featured" (the middle/Standard-style tier, or simply the
  first tier the admin lists — exact selection rule decided at implementation time
  by whoever writes the plan, defaulting to "no featured tier" if ambiguous) using
  the site's `.badge-teal` pill, consistent with how event-card badges work
  elsewhere.
- Heading now renders `event.pricingHeading` instead of the hardcoded literal.

**Placement**: `<PricingSection>`'s render call moves from its current position
(after the Training Areas / Key Topics block) to immediately above the page's
bottom Register/CTA section (the exact anchor to be located and confirmed against
the live file structure during implementation — both `events/[slug]/page.tsx` and
`training-courses/[slug]/page.tsx` get the identical placement change).

**Currency glyph**: re-extract the Bold weight's `d` path/viewBox from
`https://cbo.gov.om/Style%20Library/CBO/downloads/svg.zip` using the same method
documented in `public/currency/omr-symbol.svg`'s existing header comment (isolate
the Bold weight's path from the specimen sheet, re-fit its own tight viewBox).
Update both `public/currency/omr-symbol.svg` and the inline `<svg>` in
`currency-symbol.tsx` (currently duplicated/hardcoded in both places — keep them in
sync) to the new Bold path data. Cross-check visually against
`https://cbo.gov.om/Style%20Library/CBO/downloads/png.zip` → `Bold.png` the same
way the original Medium extraction was verified.

## Rollout / data migration

1. Add the new `EventDownload` model and the two `pricingHeadingEn/Ar` columns
   (additive part of the migration).
2. Data-migrate `opex-2026`'s current `Event.brochureUrl` value into one new
   `EventDownload` row (`labelEn: "Download Brochure"`, `labelAr: "تحميل الكتيب"`,
   `mimeType: "application/pdf"`, inferred from the known-uploaded file) via a
   scratch script, same convention as prior direct-DB content fixes this session.
3. Drop `Event.brochureUrl` in the same migration (or a fast-follow migration
   immediately after, whichever the implementer finds cleaner given this project's
   migration-history quirks already documented in the prior plan's ledger) once
   step 2 is confirmed.
4. Remove all remaining code references to `Event.brochureUrl` (admin form default
   values, `_actions.ts` create/update, `queries.ts`, both public page files).

## Testing

- Existing Vitest suite (`resolveTierAmount`) must keep passing unmodified — this
  redesign doesn't touch the registration/pricing-amount logic.
- New pure function `icon-for-mime.ts` is a good, cheap Vitest candidate (mirrors
  `resolve-tier-amount.ts`'s shape) — a plan should include a short test file for it.
- Manual/browser verification: this repo currently has a pre-existing, unrelated,
  already-investigated blocker preventing `pnpm dev`/`pnpm build` on the machine
  this session runs on (`@better-auth/*` packages declared in `pnpm-lock.yaml` but
  not materialized in `node_modules`, confirmed on `main` too). If still unresolved
  when this plan executes, verification falls back to the same substitution
  strategy as the prior plan (direct DB/query-layer checks, `tsc`/`vitest`) with the
  gap explicitly disclosed — but real browser QA of the redesigned cards is
  especially important here since this whole request originated from a *visual*
  quality complaint that only a rendered page can fully confirm. Flag this
  prominently if the blocker is still present at execution time.

## Self-review

- Placeholder scan: no TBD/TODO left; the one deliberately-left implementation
  choice (which tier is "featured") is explicitly framed as an implementer decision
  with a safe default, not a placeholder.
- Internal consistency: the "drop brochureUrl" decision is called out explicitly as
  a departure from the prior spec's additive-only convention, with justification —
  not silently contradicting it.
- Scope: focused on one cohesive redesign + one new small model; not decomposed
  further since all pieces are tightly coupled to the same user complaint.
- Ambiguity: "featured tier" selection rule and exact bottom-CTA anchor line are the
  two spots needing implementer judgment at plan-writing time — both have an
  explicit safe fallback stated above, not left open-ended.
