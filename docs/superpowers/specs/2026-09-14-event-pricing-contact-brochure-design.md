# Event pricing tiers, per-event contact numbers, brochure download — design

Status: approved by user, pending spec review
Date: 2026-09-14
Driven by: OPEX Conference 2026 content update (needed richer sidebar/content-area
data than the `Event` model currently supports).

## Problem

The public event/program page (`src/app/[locale]/events/[slug]/page.tsx` and its
duplicate `src/app/[locale]/training-courses/[slug]/page.tsx`) and its admin editor
(`src/app/[locale]/dashboard/events/_components/event-form.tsx`) currently support
only:
- a single `price: Decimal` per event
- a hardcoded literal phone number in the sidebar `EventMetaCard` ("Enquiries" row),
  identical on every event regardless of what's actually in the DB
- no brochure/download asset at all

The OPEX 2026 conference needs: multiple named pricing tiers (Super Early Bird,
Early Bird, Standard, Standard Plus, Group Rate) with bilingual copy; multiple
enquiry phone numbers; and a downloadable PDF brochure. None of this is
event-specific today — the phone number isn't even data-driven.

## Goals

1. Per-event list of contact numbers (optional label + number), sidebar falls back
   to the existing global default (`settings.contactPhone`, already used by the
   footer/contact page) when an event has none.
2. Per-event list of price tiers (bilingual title/description, price, currency,
   optional secondary display price like "USD 650"), rendered as cards in the page
   content area, with the sidebar showing "Starting from {lowest} OMR" when 2+
   tiers exist. Applies to both `eventKind` values ("event" and "training_course")
   since they share the `Event` table.
3. Per-event brochure file (PDF), uploadable in admin, downloadable from the public
   page.
4. Use the official new Omani Rial currency symbol (unveiled by the Central Bank
   of Oman, 19 Nov 2025; SVG/PNG/PDF/EPS assets at https://cbo.gov.om/omrsymbol)
   instead of the plain text "OMR" wherever a tier price is shown; USD uses the
   standard "$" glyph.

## Non-goals

- No tier-based branching of the external registration URL (OPEX 2026 uses
  `registrationType: "external"` — tiers stay informational-only for such events,
  confirmed with user).
- No enforced tier date windows (validity like "until 20 Sep" is just text in the
  tier's title/description, no start/end date fields, no auto-hide/auto-highlight
  logic).
- No live currency conversion — the secondary display price is a free-text string,
  not a computed value.
- No changes to `AgendaSession` vs `EventScheduleItem` duplication (out of scope,
  flagged separately).

## Data model changes (`prisma/schema.prisma`)

Two new tables, additive only (no column drops/renames on `Event`), following the
existing `*Translation` pattern used by `Trainer`/`AgendaSession`/etc.

```prisma
model EventContactNumber {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  number    String
  labelEn   String?
  labelAr   String?
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([eventId])
}

model EventPriceTier {
  id                    String   @id @default(cuid())
  eventId               String
  event                 Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  price                 Decimal
  currency              String   @default("OMR")
  secondaryDisplayPrice String?
  order                 Int      @default(0)
  translations          EventPriceTierTranslation[]
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([eventId])
}

model EventPriceTierTranslation {
  id          String         @id @default(cuid())
  tierId      String
  tier        EventPriceTier @relation(fields: [tierId], references: [id], onDelete: Cascade)
  locale      String
  title       String
  description String?        @db.Text

  @@unique([tierId, locale])
}
```

`Event` gets one new scalar field:

```prisma
  brochureUrl String?
```

(plain S3 URL string, same pattern as `coverImage`).

Migration: `npx prisma migrate dev --name add_event_pricing_tiers_contact_numbers_brochure`
— purely additive, safe for existing rows (all new tables/columns nullable or
empty-by-default).

## Admin UI (`event-form.tsx`)

**§04 Pricing section** (existing `price`/payment fields untouched, remain the
fallback when 0 tiers exist):
- New repeatable "Price Tiers" field array (react-hook-form `useFieldArray`, same
  pattern as the existing agenda-session array), each row: title EN, title AR,
  description EN, description AR, price, currency (default OMR), secondary
  display price (optional text), order/drag-reorder, delete.
- New file upload control "Brochure (PDF)" — reuses the existing S3 upload
  plumbing used for `coverImage`/`programLogo`, stores the resulting URL in
  `brochureUrl`. Accepts `.pdf` only; shows current file name + replace/remove
  when already set.

**§03 Location section** (or a new small subsection near it):
- New repeatable "Enquiry Numbers" field array: number (required), label EN
  (optional), label AR (optional), order/delete. Empty by default — event falls
  back to the global default when this list is empty.

**`_actions.ts`**: create/update actions extended to upsert the two new
field-array collections (delete-then-recreate per submit, same approach likely
already used for `agendaSessions`/`formFields` — confirm existing pattern before
implementing to stay consistent).

## Query layer (`src/lib/content/queries.ts`)

`getEventDetailBySlug()` extended to:
- `include` the new `contactNumbers` (ordered) and `priceTiers` (ordered, with
  `translations`) relations.
- Reshape `priceTiers` into locale-resolved `{ id, title, description, price,
  currency, secondaryDisplayPrice }[]` the same way `EventTranslation` is
  resolved elsewhere (pick the row matching `locale`, fall back to `en` if the
  requested locale is missing a translation row).
- Reshape `contactNumbers` into `{ number, label }[]` with label picked by locale
  (falling back to no label, not to the other locale's label).
- Expose `brochureUrl` as-is.

## Public rendering

**Sidebar (`RegisterCard`, `page.tsx`)**
- Price line: 0–1 tiers → unchanged single-price display (`event.isFree ? "Free"
  : `${event.price} OMR`` using the new OMR glyph instead of the "OMR" text). 2+
  tiers → "Starting from **{min tier price} {OMR glyph}**", linking/scrolling
  (`#pricing` anchor) to the content-area pricing section.
- Brochure: new row/button "Download Brochure" (only rendered when
  `event.brochureUrl` is set), plain `<a href={brochureUrl} download>`.

**Sidebar (`EventMetaCard`)**
- Enquiries row: replace the hardcoded `+968 9538 3138` literal. If
  `event.contactNumbers.length > 0`, render each as its own `tel:` link (label
  shown if present, otherwise just the number). Otherwise fall back to the
  existing global `settings.contactPhone` (already fetched elsewhere via
  `src/lib/settings.ts` — wire that same lookup into this component/query).

**Content area**
- New "Pricing" section (`id="pricing"` for the sidebar anchor), rendered only
  when `event.priceTiers.length > 0`: one card per tier — title, description,
  price with OMR glyph, secondary display price with "$" if present. Card layout
  modeled on the PDF's Delegate Enrollment Fees grid (screenshot 2 in the
  original request) but using this site's existing card/typography system, not a
  literal copy of the PDF's green background.

**Currency glyph component**
- New small component (e.g. `src/components/ui/currency-symbol.tsx`) rendering
  the official CBO Omani Rial glyph as inline SVG (downloaded from
  https://cbo.gov.om/omrsymbol under their usage guidelines, checked into
  `public/` or inlined) for `currency === "OMR"`, and a plain `$` for
  `currency === "USD"`; any other currency string falls back to showing the code
  as text (e.g. "AED"). Used everywhere a tier price or the legacy single price
  is displayed.

**`training-courses/[slug]/page.tsx`**: same changes mirrored (it's currently a
structural duplicate of `events/[slug]/page.tsx` — both get updated together,
consistent with today's duplication, not a shared-component refactor since that's
out of scope for this change).

## Registration flow

- `registrationType === "external"`: unchanged. Register button still goes
  straight to `externalRegistrationUrl`; price tiers are informational-only on
  such events (confirmed with user — OPEX 2026 itself is external).
- `registrationType === "internal"` (`event-register-form.tsx`): when
  `event.priceTiers.length > 0`, form gains a tier-selection step (radio cards,
  same title/description/price shown as the content-area cards) before the
  existing fields. Selected tier's `price` becomes the `Registration.amount` at
  submission (server action validates the submitted tier id belongs to the event
  and re-reads its price server-side rather than trusting a client-submitted
  amount). When no tiers exist, form behavior is unchanged (today's flat
  `event.price`).

## Testing

- Unit/integration: server actions for tier/contact-number CRUD (create, update,
  delete, reorder); registration server action's tier-price validation
  (reject a tier id from a different event, reject a stale/removed tier id).
- Manual/browser verification (per project convention — start dev server, check
  the real page): admin — add/edit/reorder/delete tiers and contact numbers,
  upload/replace/remove brochure; public — sidebar single-price vs
  starting-from-price rendering, pricing cards section, enquiries fallback vs
  override, brochure download button presence/absence, both locales, both
  `events` and `training-courses` routes, internal registration form tier
  picker end-to-end (submit, confirm `Registration.amount` matches selected
  tier).

## Rollout

Additive migration, backward compatible — existing events with 0 tiers/0 contact
numbers/no brochure render exactly as today (single price, global default phone,
no brochure button). OPEX 2026's own data (5 tiers, 2 contact numbers, brochure
PDF) gets populated via a follow-up data script after this ships, mirroring how
the earlier content fixes were applied directly against the live DB.
