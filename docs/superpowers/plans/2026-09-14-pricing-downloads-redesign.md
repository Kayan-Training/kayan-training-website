# Pricing Cards Redesign + Multi-Item Downloads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the sidebar's single-date display for multi-day events, replace the single `brochureUrl` with a real multi-item `EventDownload` list (animated accordion on the public page), move that admin UI to its own "Downloads" section, redesign the public pricing cards AND the admin Price Tiers editor to match this site's real design languages, make the pricing heading editable, move the pricing section to the end of the page, re-extract the Omani Rial glyph at the Bold weight, and add an optional Sidebar CTA buttons feature (bilingual label, URL, primary/secondary style). The Price Tiers editor redesign and Sidebar CTA buttons feature were added mid-planning after a design review with the user — two Artifact mockups (public pricing cards + animated downloads accordion, and the admin editor redesign) were built and approved before writing their tasks.

**Architecture:** One new Prisma model (`EventDownload`) replacing the `Event.brochureUrl` scalar (data migrated first, column dropped after — a deliberate one-time non-additive migration, justified in the spec). Two new nullable `Event` columns for the editable pricing heading. One new Prisma model (`EventSidebarCta`, purely additive) for the CTA buttons feature. Admin gets two new nav sections ("Downloads", "Sidebar CTAs") following the exact `useFieldArray` pattern already used for Price Tiers/Contact Numbers, and the existing Price Tiers editor is restyled into collapsible cards with a live price-pill summary. Public pages get a redesigned `PricingSection` (square corners, hairline borders, tinted icon chips — matching the homepage's Training Domains/accreditation card language, no shadows, no rounded corners) moved to the very end of the page, a checkbox+label-based animated downloads accordion (pure CSS, no client JS, matching the approved interactive mockup — NOT a plain `<details>`, which can't animate this smoothly) replacing the single brochure link, and optional CTA buttons rendered between the Register button and the downloads accordion.

**Tech Stack:** Next.js (custom fork, see AGENTS.md), Prisma 7 + Neon, react-hook-form + zod, `@hugeicons/react` (public pages) / `lucide-react` (admin dashboard) — two different icon libraries by existing file convention, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-14-pricing-downloads-redesign-design.md`

## Global Constraints

- No shadows, no rounded corners anywhere on the public-facing redesign — this site is globally `--radius: 0` with hairline borders (`border-outline-variant/20`) instead of shadows for depth; do not introduce `rounded-*` or `shadow-*` classes on new public elements.
- Icon libraries: public pages (`src/app/[locale]/events/[slug]/page.tsx`, `training-courses/[slug]/page.tsx`) use `@hugeicons/react` + `@hugeicons/core-free-icons`; the admin dashboard (`event-form.tsx`) uses `lucide-react`. Never cross-import one into the other's file.
- Icon selection for downloadable items is automatic from the uploaded file's `mimeType` — no admin-facing icon picker.
- No new S3-allowed mime types — downloads still only accept whatever `S3_ALLOWED_MIME_TYPES` (`src/lib/storage/s3.ts`) already allows (jpeg/png/webp/avif/svg/mp4/webm/pdf).
- Both `src/app/[locale]/events/[slug]/page.tsx` and `src/app/[locale]/training-courses/[slug]/page.tsx` (structural duplicates) get every public-facing change mirrored identically — this plan does not deduplicate them.
- Follow the existing `useFieldArray` + `form.setValue(`fieldName.${index}.subfield`, value, { shouldDirty: true })` convention for any new admin field array (matches Price Tiers/Contact Numbers editors already in `event-form.tsx`).
- The `Event.brochureUrl` column is intentionally DROPPED in this plan (not additive) — this is a deliberate, spec-approved departure from the prior plan's additive-only convention, justified because its only real data (`opex-2026`'s brochure) is migrated into `EventDownload` first, in the same maintenance window.

---

## Task 1: Fix sidebar (and header) date display for multi-day events

**Files:**
- Modify: `src/app/[locale]/events/[slug]/page.tsx` (helper functions ~line 52-67, `MetaInline` call ~line 574-578, `EventMetaCard`'s date `DetailItem` ~line 688-692)
- Modify: `src/app/[locale]/training-courses/[slug]/page.tsx` (same, offsets ~3-5 lines earlier — grep to confirm exact line numbers before editing, do not assume identical line numbers to the events file)

**Interfaces:**
- Produces: `formatDateRange(startDate: Date, endDate: Date, locale: "ar" | "en"): string` — a single date string when `startDate` and `endDate` fall on the same calendar day, a range string ("9 – 10 November 2026" style, matching `formatDate`'s `dateStyle: "long"` formatting) when they differ.

This was part of the ORIGINAL feature request (event date range display) that was scoped early on but never actually added as a task in the prior plan — a real gap, not new scope.

- [ ] **Step 1: Add `formatDateRange` next to the existing `formatDate`/`formatTimeRange` helpers in `events/[slug]/page.tsx`**

```ts
function formatDateRange(startDate: Date, endDate: Date, locale: "ar" | "en") {
  const sameDay =
    startDate.getUTCFullYear() === endDate.getUTCFullYear() &&
    startDate.getUTCMonth() === endDate.getUTCMonth() &&
    startDate.getUTCDate() === endDate.getUTCDate();
  if (sameDay) return formatDate(startDate, locale);
  const formatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-OM-u-nu-latn" : "en-GB",
    { dateStyle: "long" },
  );
  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
}
```

(Dates are stored at UTC midnight per this event model's convention — confirmed via the live `opex-2026` row during the prior plan's work — so comparing UTC calendar-day components is correct and avoids local-timezone off-by-one issues.)

- [ ] **Step 2: Replace both `formatDate(startDate, ...)` call sites with `formatDateRange(startDate, endDate, ...)`**

Line ~577 (top-of-page `MetaInline`):
```tsx
value={formatDateRange(startDate, endDate, activeLocale)}
```

Line ~691 (sidebar `EventMetaCard`'s `DetailItem`):
```tsx
value={formatDateRange(startDate, endDate, locale)}
```

- [ ] **Step 3: Repeat Steps 1-2 identically in `training-courses/[slug]/page.tsx`** (grep for `function formatDate(` and the two `formatDate(startDate` call sites in that file first — do not assume identical line numbers)

- [ ] **Step 4: Manual verification**

Run: `npx tsc --noEmit`. Then trace by hand: for `opex-2026` (`startDate: 2026-11-09`, `endDate: 2026-11-10`), confirm `formatDateRange` returns "9 – 10 November 2026" (en) / an Arabic equivalent range (ar), not just "9 November 2026". For a single-day event (`startDate === endDate`'s calendar day), confirm it still returns the plain single-date string unchanged.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/events/[slug]/page.tsx" "src/app/[locale]/training-courses/[slug]/page.tsx"
git commit -m "fix: show date range in event sidebar/header for multi-day events"
```

---

## Task 2: Prisma schema — add EventDownload + pricingHeading columns (additive migration)

**Files:**
- Modify: `prisma/schema.prisma` (Event model, insert `EventDownload` model near `EventContactNumber`)
- Migration: generated by `npx prisma migrate dev`

**Interfaces:**
- Produces: `EventDownload { id, eventId, fileUrl, mimeType, labelEn, labelAr, order }`, `Event.pricingHeadingEn: String?`, `Event.pricingHeadingAr: String?`. `Event.brochureUrl` is NOT touched yet (dropped in Task 4, after data migration in Task 3).

- [ ] **Step 1: Add the new model and two columns to `prisma/schema.prisma`**

Add to `Event`'s scalar fields (near `brochureUrl`, which stays for now):
```prisma
  pricingHeadingEn String?
  pricingHeadingAr String?
```

Add to `Event`'s relations block:
```prisma
  downloads      EventDownload[]
```

Add the new model near `EventContactNumber`:
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

- [ ] **Step 2: Generate and apply the migration**

Run: `npx prisma migrate dev --name add_event_downloads_and_pricing_heading`
Expected: additive migration (one new table, two new nullable columns), applies cleanly against the live dev DB (the prior plan's ledger documents this repo's `prisma/migrations` folder is gitignored and was previously baselined manually — check `npx prisma migrate status` first; if it reports drift again, use the same baseline-then-migrate technique documented in that ledger rather than accepting a destructive reset).

- [ ] **Step 3: Regenerate the Prisma client**

Run: `npx prisma generate`. Confirm `src/generated/prisma/models/EventDownload.ts` exists and `src/generated/prisma/models/Event.ts` contains `pricingHeadingEn`/`pricingHeadingAr`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add EventDownload model and pricingHeading columns"
```

---

## Task 3: Migrate opex-2026's brochureUrl into EventDownload

**Files:**
- No repo files — scratch script only, deleted after running (same convention as the prior plan's data-migration steps).

**Interfaces:**
- Consumes: `Event.brochureUrl` (still present, from before Task 2/4).
- Produces: one real `EventDownload` row for `opex-2026`.

- [ ] **Step 1: Write and run a scratch script that reads `opex-2026`'s current `brochureUrl` and creates one `EventDownload` row from it**

```ts
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./src/generated/prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const event = await prisma.event.findUnique({ where: { slug: "opex-2026" } });
  if (!event) throw new Error("NOT FOUND");
  if (!event.brochureUrl) {
    console.log("No brochureUrl set — nothing to migrate.");
    return;
  }
  const existing = await prisma.eventDownload.findFirst({
    where: { eventId: event.id, fileUrl: event.brochureUrl },
  });
  if (existing) {
    console.log("Already migrated, skipping.");
    return;
  }
  await prisma.eventDownload.create({
    data: {
      eventId: event.id,
      fileUrl: event.brochureUrl,
      mimeType: "application/pdf",
      labelEn: "Download Brochure",
      labelAr: "تحميل الكتيب",
      order: 0,
    },
  });
  console.log("Migrated:", event.brochureUrl);
}

main().finally(() => prisma.$disconnect());
```

Run it, confirm the "Migrated: <url>" output.

- [ ] **Step 2: Verify via read-back**

Query `prisma.eventDownload.findMany({ where: { eventId: <opex-2026's id> } })` and confirm exactly one row with the expected `fileUrl`/`labelEn`/`labelAr`.

- [ ] **Step 3: Delete the scratch script** (not committed — this is a one-time data migration, same convention as the prior plan)

```bash
rm -f tmp-migrate-brochure-to-downloads.ts
git status --short
```

Expected: clean, no repo file changes from this task.

---

## Task 4: Drop Event.brochureUrl (schema + all code references)

**Files:**
- Modify: `prisma/schema.prisma` (remove `brochureUrl` field)
- Modify: `src/lib/content/queries.ts:627` (remove `brochureUrl: event.brochureUrl,` from the return object)
- Modify: `src/app/[locale]/dashboard/events/_components/event-form.tsx` (remove zod field at line ~214, default at ~2169, upload-handler `setValue` at ~2718, and the entire Brochure UI block at ~4353-4423 — see Task 5/6 which REPLACE this block with the new Downloads section, so removal and replacement happen together, not as two separate edits)
- Modify: `src/app/[locale]/dashboard/events/_actions.ts:123,368` (remove `brochureUrl: values.brochureUrl || null,` from both create and update)
- Modify: `src/app/[locale]/dashboard/programs/[id]/page.tsx:128` (remove `brochureUrl: event.brochureUrl ?? "",` from `defaultValues`)
- Modify: `src/app/[locale]/events/[slug]/page.tsx:240-248` (remove the old brochure `<a>` block — replaced by the Downloads accordion in Task 10)
- Modify: `src/app/[locale]/training-courses/[slug]/page.tsx` (same, ~line 237-245)
- Migration: generated by `npx prisma migrate dev`

**Interfaces:**
- Removes: `Event.brochureUrl` everywhere. Nothing later depends on it — Task 6/7/8/10 build the replacement (`downloads`) independently.

- [ ] **Step 1: Remove `brochureUrl` from `prisma/schema.prisma`'s `Event` model**

- [ ] **Step 2: Generate the drop migration**

Run: `npx prisma migrate dev --name drop_event_brochure_url`
Expected: one `ALTER TABLE "Event" DROP COLUMN "brochureUrl"`. Since Task 3 already copied the one real value out, this is safe — confirm via `npx prisma migrate status` afterward.

- [ ] **Step 3: Remove `brochureUrl` from `queries.ts`'s return object** (line ~627 — just delete that one line; Task 9 adds `downloads`/`pricingHeading` to this same return object separately)

- [ ] **Step 4: Remove `brochureUrl` from `event-form.tsx`'s zod schema, defaults, and upload handler** (lines ~214, ~2169, ~2718). Leave the Brochure UI JSX block (~4353-4423) and its supporting state (`isBrochureUploading`, `brochureUploadProgress`, `brochureInputRef`, `uploadBrochure`) in place for now — Task 6 replaces/repurposes this block wholesale for the new Downloads field array, so removing it here and rebuilding it in Task 6 would just be double work. Only remove the 3 direct `brochureUrl` references that don't belong to that block (zod field, default value, the `form.setValue("brochureUrl", ...)` line inside `uploadBrochure` — Task 6 will repurpose `uploadBrochure` itself into the new downloads uploader, so leave that function body alone for now too; just delete the standalone zod/default lines).

- [ ] **Step 5: Remove `brochureUrl` from `_actions.ts`'s create and update `data` objects** (lines ~123, ~368 — one line each)

- [ ] **Step 6: Remove `brochureUrl` from `programs/[id]/page.tsx`'s `defaultValues`** (line ~128)

- [ ] **Step 7: Remove the old brochure `<a>` block from both public page files' `RegisterCard`** (events/[slug]/page.tsx ~240-248, training-courses ~237-245) — Task 10 adds the replacement Downloads accordion in the same spot.

- [ ] **Step 8: Regenerate the Prisma client and verify**

Run: `npx prisma generate`, then `npx tsc --noEmit`.
Expected: type errors will appear for the pieces this task deliberately leaves half-wired (e.g. `event-form.tsx` still referencing `form.watch("brochureUrl")` inside the untouched JSX block from Step 4, `event.downloads`/`event.pricingHeading` not yet existing on the query's return type). This is EXPECTED at this checkpoint — Tasks 5-9 complete the wiring. Do not try to make `tsc` fully clean within this task; just confirm the changes made in Steps 1-7 are exactly as specified (no accidental extra edits) via `git diff`.

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma src/lib/content/queries.ts "src/app/[locale]/dashboard/events/_components/event-form.tsx" "src/app/[locale]/dashboard/events/_actions.ts" "src/app/[locale]/dashboard/programs/[id]/page.tsx" "src/app/[locale]/events/[slug]/page.tsx" "src/app/[locale]/training-courses/[slug]/page.tsx"
git commit -m "refactor: drop Event.brochureUrl (migrated to EventDownload)"
```

---

## Task 5: Download file-category helper + tests

**Files:**
- Create: `src/lib/downloads/get-download-file-category.ts`
- Create: `src/lib/downloads/__tests__/get-download-file-category.test.ts`

**Interfaces:**
- Produces: `getDownloadFileCategory(mimeType: string): "pdf" | "image" | "other"`. Task 6 (admin, lucide icons) and Task 10 (public, hugeicons) both call this and map the returned category to their own library's icon component — this function itself never imports an icon library.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { getDownloadFileCategory } from "@/lib/downloads/get-download-file-category";

describe("getDownloadFileCategory", () => {
  it("returns 'pdf' for application/pdf", () => {
    expect(getDownloadFileCategory("application/pdf")).toBe("pdf");
  });

  it("returns 'image' for any image/* mime type", () => {
    expect(getDownloadFileCategory("image/png")).toBe("image");
    expect(getDownloadFileCategory("image/webp")).toBe("image");
  });

  it("returns 'other' for anything else", () => {
    expect(getDownloadFileCategory("video/mp4")).toBe("other");
    expect(getDownloadFileCategory("application/octet-stream")).toBe("other");
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm test:unit -- get-download-file-category`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
export type DownloadFileCategory = "pdf" | "image" | "other";

export function getDownloadFileCategory(mimeType: string): DownloadFileCategory {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  return "other";
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `pnpm test:unit`
Expected: this suite's 3 tests pass, plus the pre-existing `resolveTierAmount` suite (4 tests) still passes — 7 total.

- [ ] **Step 5: Commit**

```bash
git add src/lib/downloads/get-download-file-category.ts src/lib/downloads/__tests__/get-download-file-category.test.ts
git commit -m "feat: add download file-category helper with tests"
```

---

## Task 6: Admin UI — new "Downloads" section (replaces old Brochure block)

**Files:**
- Modify: `src/lib/events/event-form-visibility.ts` (add `"downloads"` to `EventFormSectionId`)
- Modify: `src/lib/events/event-form-rail.ts` (add `"downloads"` to the `"experience"` group's `sectionIds`)
- Modify: `src/lib/events/event-form-health.ts` (add a `downloads` branch — optional section, always "done"/non-blocking)
- Modify: `src/app/[locale]/dashboard/events/_components/event-form.tsx` (zod schema, `sections` array, rail label, new section content block replacing the old Brochure JSX)

**Interfaces:**
- Consumes: `getDownloadFileCategory` from Task 5 (for the admin's own file-type icon in the uploaded-item row).
- Produces: `EventFormValues["downloads"]: { labelEn: string; labelAr: string; fileUrl: string; mimeType: string }[]`. Task 7 (`_actions.ts`) persists this array. Task 8 (`programs/[id]/page.tsx`) populates it on edit.

- [ ] **Step 1: Add `"downloads"` to `EventFormSectionId` in `event-form-visibility.ts`**

```ts
export type EventFormSectionId =
  | "identity"
  | "schedule"
  | "location"
  | "pricing"
  | "content"
  | "gallery"
  | "downloads"
  | "agenda"
  | "trainers"
  | "categories"
  | "registrationForm"
  | "registrations";
```

- [ ] **Step 2: Add `"downloads"` to the `"experience"` rail group in `event-form-rail.ts`**

```ts
    {
      id: "experience",
      label: "Experience",
      sectionIds: ["content", "gallery", "downloads", "agenda"],
    },
```

- [ ] **Step 3: Add a `downloads` health branch in `event-form-health.ts`**

Add `downloadsCount: number;` to `EventFormHealthInputs`. Add to `errorCountBySection`:
```ts
    downloads: errorPaths.filter((path) => path.startsWith("downloads.")).length,
```
Add to `completionBySection` (optional section, always complete regardless of count — matches how `agenda`/`gallery` are optional-but-tracked, except downloads should never block publish, so mark it always `true`):
```ts
    downloads: true,
```
Update the `satisfies Record<EventFormSectionId, number>` / `satisfies Record<EventFormSectionId, boolean>` object literals — TypeScript will error if `downloads` is missing from either, which is the intended safety net for this step.

- [ ] **Step 4: Add the `downloadItemSchema` next to `contactNumberItemSchema` in `event-form.tsx`, and register it on `eventSchema`**

```ts
const downloadItemSchema = z.object({
  labelEn: z.string().min(1, "Label (English) is required"),
  labelAr: z.string().min(1, "Label (Arabic) is required"),
  fileUrl: z.string().min(1, "File is required"),
  mimeType: z.string().min(1),
});
```
Add to the top-level `eventSchema` object, next to `contactNumbers: z.array(contactNumberItemSchema),`:
```ts
  downloads: z.array(downloadItemSchema),
```
Add to `initialFormValues`, next to `contactNumbers: initialEvent?.contactNumbers ?? [],` (matching this file's actual field name for that initial-values source object, confirmed in the prior plan as `defaultValues?: Partial<EventFormValues>` fed in via `...defaultValues` spread — add `downloads: []` in the same flat literal as `contactNumbers: []`):
```ts
      downloads: [],
```

- [ ] **Step 5: Add `{ icon: Download, id: "downloads", label: "Downloads" }` to the `sections` array** (next to the existing `{ icon: ImageIcon, id: "gallery", ... }` entry — `Download` is already imported from `lucide-react` per the prior plan's research, confirm via `grep "^import.*Download.*lucide-react" event-form.tsx` before assuming; if it's not already imported, add it to the existing `lucide-react` import statement)

- [ ] **Step 6: Add the `useFieldArray` hook next to `contactNumbers`**

```ts
const downloads = useFieldArray({ control: form.control, name: "downloads" });
```

- [ ] **Step 7: Replace the old Brochure block (the JSX at ~4353-4423 left in place by Task 4 Step 4) with the new Downloads section content, rendered under `activeSection === "downloads"`**

First, repurpose the existing `uploadBrochure` function (rename to `uploadDownloadFile`, keeping its `isBrochureUploading`/`brochureUploadProgress`/`brochureUploadStatus`/`brochureInputRef` state — rename these too for clarity, e.g. `isDownloadUploading` etc.) to accept an index so it knows which field-array row to update, and to accept any of `S3_ALLOWED_MIME_TYPES` rather than gating on `application/pdf` only:

```tsx
async function uploadDownloadFile(index: number, file: File | undefined) {
  if (!file) return;
  setIsDownloadUploading(true);
  setDownloadUploadProgress(0);
  setDownloadUploadStatus("");
  try {
    const media = await uploadMediaFile(file, {
      onProgress: (percent) => setDownloadUploadProgress(percent),
      onStatus: (status) => setDownloadUploadStatus(status),
    });
    form.setValue(`downloads.${index}.fileUrl`, media.url, { shouldDirty: true });
    form.setValue(`downloads.${index}.mimeType`, media.mimeType, { shouldDirty: true });
    toast.success("File uploaded.");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Upload failed.");
  } finally {
    setIsDownloadUploading(false);
  }
}
```

Then the section content, mirroring the Contact Numbers field-array editor's structure:

```tsx
{activeSection === "downloads" && (
  <FieldSet>
    <SectionHeader
      description="Files visitors can download from the public page (brochure, registration details, etc.)."
      icon={Download}
      number="07"
      title="Downloads"
    />
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() =>
            downloads.append({ labelEn: "", labelAr: "", fileUrl: "", mimeType: "" })
          }
        >
          Add Download
        </Button>
      </div>

      {downloads.fields.map((field, index) => {
        const fileUrl = form.watch(`downloads.${index}.fileUrl`);
        const mimeType = form.watch(`downloads.${index}.mimeType`);
        const category = getDownloadFileCategory(mimeType || "");
        const CategoryIcon = category === "pdf" ? FileText : category === "image" ? ImageIcon : File;
        return (
          <div key={field.id} className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Label (English)</Label>
                <Input
                  value={form.watch(`downloads.${index}.labelEn`)}
                  onChange={(e) =>
                    form.setValue(`downloads.${index}.labelEn`, e.target.value, { shouldDirty: true })
                  }
                  placeholder="Download Brochure"
                />
              </div>
              <div>
                <Label>Label (Arabic)</Label>
                <Input
                  dir="rtl"
                  value={form.watch(`downloads.${index}.labelAr`)}
                  onChange={(e) =>
                    form.setValue(`downloads.${index}.labelAr`, e.target.value, { shouldDirty: true })
                  }
                  placeholder="تحميل الكتيب"
                />
              </div>
            </div>
            {fileUrl ? (
              <div className="flex items-center justify-between rounded border border-zinc-200 p-3">
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 truncate text-sm text-primary underline">
                  <CategoryIcon className="size-4 shrink-0" />
                  {fileUrl.split("/").pop()}
                </a>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="cursor-pointer" onClick={() => document.getElementById(`download-input-${index}`)?.click()}>
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => {
                      form.setValue(`downloads.${index}.fileUrl`, "", { shouldDirty: true });
                      form.setValue(`downloads.${index}.mimeType`, "", { shouldDirty: true });
                    }}
                  >
                    Remove File
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                disabled={isDownloadUploading}
                onClick={() => document.getElementById(`download-input-${index}`)?.click()}
              >
                {isDownloadUploading ? "Uploading..." : "Upload File"}
              </Button>
            )}
            <input
              id={`download-input-${index}`}
              className="sr-only"
              type="file"
              onChange={(e) => void uploadDownloadFile(index, e.target.files?.[0])}
            />
            {isDownloadUploading && (
              <UploadProgress progress={downloadUploadProgress} status={downloadUploadStatus} />
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="cursor-pointer"
              onClick={() => downloads.remove(index)}
            >
              <HugeiconsIcon icon={Delete02Icon} className="text-destructive" />
              Remove Item
            </Button>
          </div>
        );
      })}
    </div>
  </FieldSet>
)}
```

(`FileText`, `Image as ImageIcon`, `File` from `lucide-react` — check existing imports first, `ImageIcon` per the prior plan's research is already imported for the Gallery section's own icon; reuse it, don't re-import under a different alias unless there's a naming collision, in which case alias the new one instead, e.g. `File as FileIconLucide`.)

- [ ] **Step 8: Add the pricing-heading fields to §04 Pricing** (small addition, unrelated to downloads but grouped here since it's a similarly-sized admin field addition — add near the top of the Pricing section, before the Price Tiers block):

```tsx
<div className="grid grid-cols-2 gap-3 mb-6">
  <div>
    <Label>Pricing section heading (English, optional)</Label>
    <Input
      value={form.watch("pricingHeadingEn")}
      onChange={(e) => form.setValue("pricingHeadingEn", e.target.value, { shouldDirty: true })}
      placeholder="Pricing"
    />
  </div>
  <div>
    <Label>Pricing section heading (Arabic, optional)</Label>
    <Input
      dir="rtl"
      value={form.watch("pricingHeadingAr")}
      onChange={(e) => form.setValue("pricingHeadingAr", e.target.value, { shouldDirty: true })}
      placeholder="الأسعار"
    />
  </div>
</div>
```

Add `pricingHeadingEn: z.string(), pricingHeadingAr: z.string(),` to `eventSchema` and `pricingHeadingEn: "", pricingHeadingAr: "",` to `initialFormValues`.

- [ ] **Step 9: Verify**

Run: `npx tsc --noEmit`. Type errors from Task 4's deliberate half-wiring (the old `brochureUrl` JSX) should now be GONE since this task fully replaced that block. Any remaining errors should only be about `event.downloads`/`event.pricingHeading` not existing on `queries.ts`'s return type yet — that's Task 9.

- [ ] **Step 10: Commit**

```bash
git add src/lib/events/event-form-visibility.ts src/lib/events/event-form-rail.ts src/lib/events/event-form-health.ts "src/app/[locale]/dashboard/events/_components/event-form.tsx"
git commit -m "feat: add Downloads admin section and editable pricing heading"
```

---

## Task 7: Persist downloads + pricingHeading in create/update actions

**Files:**
- Modify: `src/app/[locale]/dashboard/events/_actions.ts` (`createEventAction` and `updateEventAction`)

**Interfaces:**
- Consumes: `EventFormValues.downloads`, `.pricingHeadingEn`, `.pricingHeadingAr` from Task 6.
- Produces: `EventDownload` rows, `Event.pricingHeadingEn/Ar` columns.

- [ ] **Step 1: Add `pricingHeadingEn`/`pricingHeadingAr` to both create and update `data` objects**

```ts
      pricingHeadingEn: values.pricingHeadingEn || null,
      pricingHeadingAr: values.pricingHeadingAr || null,
```

- [ ] **Step 2: `createEventAction` — add nested `downloads` create**, alongside the existing `contactNumbers`/`priceTiers` nested creates:

```ts
      downloads:
        values.downloads.length > 0
          ? {
              create: values.downloads.map((d, i) => ({
                fileUrl: d.fileUrl,
                mimeType: d.mimeType,
                labelEn: d.labelEn,
                labelAr: d.labelAr,
                order: i,
              })),
            }
          : undefined,
```

- [ ] **Step 3: `updateEventAction` — add delete+recreate for downloads**, alongside the existing `eventContactNumber`/`eventPriceTier` blocks:

```ts
    await db.eventDownload.deleteMany({ where: { eventId: id } });
    if (values.downloads.length > 0) {
      await db.eventDownload.createMany({
        data: values.downloads.map((d, i) => ({
          eventId: id,
          fileUrl: d.fileUrl,
          mimeType: d.mimeType,
          labelEn: d.labelEn,
          labelAr: d.labelAr,
          order: i,
        })),
      });
    }
```

- [ ] **Step 4: Verify against the real DB**

Run: `npx tsc --noEmit`. Then, same convention as the prior plan's Task 6/7: create a disposable test event via a scratch script exercising `createEventAction`-equivalent Prisma calls (or call the action directly if that's simpler from a script context), add 2 downloads, save, fetch back, confirm both rows persist with correct fields, then delete the test event (cascade removes its downloads) and delete the scratch script. Do NOT test against `opex-2026` for this create/update round-trip check — use a disposable event only.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/dashboard/events/_actions.ts"
git commit -m "feat: persist downloads and pricing heading on event create/update"
```

---

## Task 8: Wire downloads + pricingHeading into the admin edit page

**Files:**
- Modify: `src/app/[locale]/dashboard/programs/[id]/page.tsx`

**Interfaces:**
- Consumes: `EventDownload` rows via a new `include`.
- Produces: `defaultValues.downloads`, `.pricingHeadingEn`, `.pricingHeadingAr` — closing the same "edit page has its own separate fetch" gap the prior plan's Task 7 amendment fixed for tiers/contact numbers. Skipping this step here would cause the exact same silent-data-wipe bug on save.

- [ ] **Step 1: Add `downloads: { orderBy: { order: "asc" } }` to the `db.event.findUnique`'s `include` object** (alongside the existing `contactNumbers`/`priceTiers` includes)

- [ ] **Step 2: Add to `defaultValues`**

```ts
    pricingHeadingEn: event.pricingHeadingEn ?? "",
    pricingHeadingAr: event.pricingHeadingAr ?? "",
    downloads: event.downloads.map((d) => ({
      labelEn: d.labelEn,
      labelAr: d.labelAr,
      fileUrl: d.fileUrl,
      mimeType: d.mimeType,
    })),
```

- [ ] **Step 3: Manual verification**

Same round-trip pattern as the prior plan's Task 7: edit an event with downloads via a scratch script simulating "load defaultValues, save without touching downloads", confirm they survive (not wiped by Task 7's delete-then-recreate). Clean up the scratch script afterward.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/dashboard/programs/[id]/page.tsx"
git commit -m "feat: wire downloads and pricing heading into admin edit page"
```

---

## Task 9: Query layer — resolve downloads + pricingHeading (and finish removing brochureUrl)

**Files:**
- Modify: `src/lib/content/queries.ts`

**Interfaces:**
- Produces: `EventDetail.downloads: { id: string; fileUrl: string; mimeType: string; label: string }[]`, `EventDetail.pricingHeading: string`.

- [ ] **Step 1: Add `downloads: { orderBy: { order: "asc" } }` to `getEventDetailBySlug`'s Prisma `include`**

- [ ] **Step 2: Resolve `downloads`** (label picked by locale, no cross-locale fallback — same rule as contact numbers; in practice both labels are always set since Task 6's zod schema requires both, but resolve defensively the same way anyway):

```ts
  const downloads = event.downloads.map((d) => ({
    id: d.id,
    fileUrl: d.fileUrl,
    mimeType: d.mimeType,
    label: locale === "ar" ? d.labelAr : d.labelEn,
  }));
```

- [ ] **Step 3: Resolve `pricingHeading`**

```ts
  const pricingHeading =
    (locale === "ar" ? event.pricingHeadingAr : event.pricingHeadingEn) ||
    (locale === "ar" ? "الأسعار" : "Pricing");
```

- [ ] **Step 4: Add `downloads` and `pricingHeading` to the function's return object** (this is also where `brochureUrl` used to be returned, per Task 4 Step 3 — confirm it's gone, don't re-add it)

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` — should now be fully clean (Task 4's deliberate half-wiring is fully resolved by this task). Then run the same scratch-script pattern as the prior plan's Task 8: call `getEventDetailBySlug("en", "opex-2026", {...})` and `("ar", ...)`, confirm `downloads` returns the one real item migrated in Task 3 (label "Download Brochure" / "تحميل الكتيب", correct `fileUrl`/`mimeType`), and `pricingHeading` falls back to "Pricing"/"الأسعار" (since `opex-2026` has no custom heading set yet). Delete the scratch script afterward.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content/queries.ts
git commit -m "feat: resolve downloads and pricing heading in getEventDetailBySlug"
```

---

## Task 10: Public Downloads accordion (replaces single brochure link)

**Files:**
- Modify: `src/app/[locale]/events/[slug]/page.tsx` (add a `DownloadsAccordion` function, use it in `RegisterCard` where the old brochure `<a>` was removed in Task 4)
- Modify: `src/app/[locale]/training-courses/[slug]/page.tsx` (same)

**Interfaces:**
- Consumes: `event.downloads` from Task 9, `getDownloadFileCategory` from Task 5.
- Produces: rendered UI only.

- [ ] **Step 1: Confirm the real hugeicons exports before writing imports** (already verified in this plan's research, but re-confirm the exact names exist in this project's installed version before use): `Download01Icon`, `Pdf02Icon`, `Image02Icon`, `File02Icon` from `@hugeicons/core-free-icons`.

- [ ] **Step 2: Add the `DownloadsAccordion` component using the animated checkbox+label pattern approved in the design review** (NOT a plain `<details>` — the approved mockup uses a hidden checkbox + `<label>` toggle so the expand/collapse, chevron rotation, and per-item cascade-in can be pure-CSS animated via `grid-template-rows: 0fr → 1fr`, which a native `<details>` cannot do smoothly without JS. This needs a stable, unique `id` per event since a page can render multiple `RegisterCard`s in different layout branches — use the event's `id` to namespace it, e.g. `downloads-toggle-${event.id}`):

```tsx
function DownloadsAccordion({
  downloads,
  eventId,
  locale,
}: {
  downloads: NonNullable<Awaited<ReturnType<typeof getEventDetailBySlug>>>["downloads"];
  eventId: string;
  locale: "ar" | "en";
}) {
  if (downloads.length === 0) return null;
  const toggleId = `downloads-toggle-${eventId}`;
  return (
    <div className="ghost-border mt-3 bg-surface-container-low [&:has(input:checked)_.downloads-chevron]:rotate-180">
      <input className="peer sr-only" defaultChecked id={toggleId} type="checkbox" />
      <label
        className="flex cursor-pointer items-center justify-center gap-2 py-3 text-sm font-medium text-on-surface transition-colors hover:text-secondary"
        htmlFor={toggleId}
      >
        <HugeiconsIcon icon={Download01Icon} size={16} />
        {locale === "ar" ? "التنزيلات" : "Downloads"}
        <HugeiconsIcon
          className="downloads-chevron transition-transform duration-300"
          icon={ArrowDown01Icon}
          size={14}
        />
      </label>
      <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out peer-checked:grid-rows-[1fr]">
        <div className="overflow-hidden">
          {downloads.map((item, index) => {
            const category = getDownloadFileCategory(item.mimeType);
            const ItemIcon =
              category === "pdf" ? Pdf02Icon : category === "image" ? Image02Icon : File02Icon;
            return (
              <a
                key={item.id}
                href={item.fileUrl}
                download
                className="flex items-center gap-2 border-t border-outline-variant/20 px-4 py-3 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <HugeiconsIcon icon={ItemIcon} size={16} />
                {item.label}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

Note on `defaultChecked`: the approved mockup ships with the accordion OPEN by default (matches the artifact-design principle that interactive content should be visible at rest, not hidden behind an unopened disclosure) — keep this default-open behavior in the real component too, don't default it closed.

Also confirm `ArrowDown01Icon` is a real export in this project's installed `@hugeicons/core-free-icons` (confirmed during this plan's design research — this package has no `ChevronDown*Icon`, `ArrowDown01Icon` is the equivalent used elsewhere in this codebase, e.g. `src/components/ui/select.tsx`).

- [ ] **Step 3: Use it in `RegisterCard`, in place of the removed brochure `<a>` block** (same position, right after the register button/status block — Task 14 later inserts the new Sidebar CTA buttons BETWEEN the register button and this accordion, so leave clear separation between these blocks rather than merging them):

```tsx
<DownloadsAccordion downloads={event.downloads} eventId={event.id} locale={locale} />
```

- [ ] **Step 4: Repeat Steps 1-3 identically in `training-courses/[slug]/page.tsx`**

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`. Manually trace: with `opex-2026` now having 1 real download (Task 3's migration), confirm the accordion renders a "Downloads" toggle that expands to show "Download Brochure" with a PDF icon linking to the real S3 URL. With 0 downloads (any other event), confirm nothing renders (`DownloadsAccordion` returns `null`).

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/events/[slug]/page.tsx" "src/app/[locale]/training-courses/[slug]/page.tsx"
git commit -m "feat: replace single brochure link with multi-item downloads accordion"
```

---

## Task 11: Redesign public pricing cards + editable heading + move placement

**Files:**
- Modify: `src/app/[locale]/events/[slug]/page.tsx` (`PricingSection` function ~line 253-286, both call sites ~line 529/618, and the "Other Events" section boundary ~line 619+)
- Modify: `src/app/[locale]/training-courses/[slug]/page.tsx` (same)

**Interfaces:**
- Consumes: `event.pricingHeading` from Task 9.
- Produces: redesigned `PricingSection`, moved to render after "Other Events You May Like" (the true end of the page's content, "last thing before the final CTA/footer" per the spec's chosen placement option — there is no separate bottom CTA banner on this page today, so the last content section is the correct interpretation of that requirement).

- [ ] **Step 1: Confirm `Ticket01Icon` exists in this project's installed hugeicons package** (already verified during this plan's research — re-confirm via `grep "Ticket01Icon" node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts` before use)

- [ ] **Step 2: Rewrite `PricingSection`** to accept a `heading` prop and use the site's real design language (icon chip, hairline border, square corners, hover lift — matching the homepage's Training Domains/accreditation card patterns researched for this plan; individual bordered cards rather than a seamless shared-border grid, to avoid fragile last-row/last-column border-removal logic across responsive breakpoints):

```tsx
function PricingSection({
  tiers,
  heading,
  locale,
}: {
  tiers: NonNullable<Awaited<ReturnType<typeof getEventDetailBySlug>>>["priceTiers"];
  heading: string;
  locale: "ar" | "en";
}) {
  if (tiers.length === 0) return null;
  return (
    <section id="pricing" className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-24">
      <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
        {locale === "ar" ? "التسجيل" : "Registration"}
      </span>
      <h2 className="mb-10 text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-tight text-on-surface">
        {heading}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="group flex flex-col gap-4 border border-outline-variant/20 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-secondary/40"
          >
            <div className="flex h-10 w-10 items-center justify-center border border-secondary/40 bg-secondary/15 text-secondary">
              <HugeiconsIcon icon={Ticket01Icon} size={20} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-on-surface">{tier.title}</h3>
            <div className="flex items-baseline gap-2 font-mono text-3xl font-semibold text-secondary">
              <CurrencySymbol currency={tier.currency} /> {tier.price}
              {tier.secondaryDisplayPrice && (
                <span className="text-sm font-normal text-on-surface-variant">
                  ({tier.secondaryDisplayPrice})
                </span>
              )}
            </div>
            {tier.description && (
              <p className="text-sm leading-relaxed text-on-surface-variant">{tier.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Move both `<PricingSection>` call sites to render AFTER the "Other Events You May Like" section** (currently the section that follows immediately at line ~619+; the featured-layout branch at ~529 has no such trailing section today — confirm by reading the file whether that branch has any content after its own grid section, and if not, add `<PricingSection>` as the new last element in that branch's `<main>` before it closes). Update both call sites to pass `heading={event.pricingHeading}`:

```tsx
<PricingSection heading={event.pricingHeading} locale={activeLocale} tiers={event.priceTiers} />
```

- [ ] **Step 4: Repeat Steps 1-3 identically in `training-courses/[slug]/page.tsx`**

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`. Manually trace the JSX structure to confirm `PricingSection` is now the last rendered section on the page (after "Other Events"/"Other Courses You May Like"), not sandwiched between the main grid and that related-items list as it was before.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/events/[slug]/page.tsx" "src/app/[locale]/training-courses/[slug]/page.tsx"
git commit -m "feat: redesign pricing cards, make heading editable, move to end of page"
```

---

## Task 12: Re-extract the Omani Rial glyph at Bold weight

**Files:**
- Modify: `public/currency/omr-symbol.svg`
- Modify: `src/components/ui/currency-symbol.tsx`

**Interfaces:**
- No interface change — `<CurrencySymbol currency="OMR" />`'s public prop signature and behavior stay identical; only the path data inside changes.

- [ ] **Step 1: Fetch the same CBO asset bundle used previously, isolate the Bold weight this time**

Source: `https://cbo.gov.om/Style%20Library/CBO/downloads/svg.zip` (documented in the existing file's header comment). This zip's SVG is a specimen sheet with Light/Medium/Bold weights side by side — last time the Medium weight's `<path>` was isolated; this time isolate the **Bold** weight's `<path>` instead, using the same method (identify the path element positioned at the "Bold" label in the specimen, extract its unmodified `d` attribute, compute its own tight bounding-box `viewBox`). Cross-check visually against `https://cbo.gov.om/Style%20Library/CBO/downloads/png.zip` → `Bold.png` the same way the original Medium extraction was verified (open the PNG, confirm the extracted path's shape/proportions match).

- [ ] **Step 2: Update `public/currency/omr-symbol.svg`** with the new Bold path/viewBox, keeping the same header comment format but noting "Bold" weight instead of "Medium":

```xml
<!-- Official Omani Rial symbol, unveiled by the Central Bank of Oman on 19 Nov 2025.
     Source: https://cbo.gov.om/omrsymbol (SVG asset bundle: /Style%20Library/CBO/downloads/svg.zip).
     This file extracts the "Bold" weight glyph path from that official vector artwork
     (unmodified path data) and re-fits it to its own tight viewBox for use as a
     standalone inline icon (previously used the "Medium" weight — switched to Bold
     per user feedback that Medium read as too thin against this site's typography). -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="[BOLD VIEWBOX]" role="img" aria-label="OMR">
  <path fill="currentColor" d="[BOLD PATH DATA]"/>
</svg>
```

- [ ] **Step 3: Update the inline `<svg>` in `currency-symbol.tsx`** with the identical new `viewBox`/`d` (this file duplicates the SVG file's content inline per the prior plan's Critical-finding fix — keep both in sync)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`. If any SVG rasterization/validation tool is available (e.g. `npx svgo --dry-run public/currency/omr-symbol.svg`, matching the prior plan's verification method), confirm the file is well-formed. Visually compare the extracted Bold glyph's stroke weight against `Bold.png` from the same zip to confirm it's genuinely heavier than the previous Medium extraction.

- [ ] **Step 5: Commit**

```bash
git add public/currency/omr-symbol.svg src/components/ui/currency-symbol.tsx
git commit -m "fix: use Bold weight for Omani Rial currency glyph"
```

---

## Task 13: Redesign the admin Price Tiers editor (collapsible cards, live price pill)

Added after a design review with the user (two Artifact mockups approved: a before/after of the public pricing cards, and this admin editor redesign specifically — approved as-is). The prior plan shipped the Price Tiers editor as a flat card per tier with all 6 fields always visible and a floated delete button; this redesigns it into a collapsible summary/detail card matching the approved mockup.

**Files:**
- Modify: `src/app/[locale]/dashboard/events/_components/event-form.tsx` (Price Tiers block, currently starting ~line 4482 — re-grep `"Price Tiers (optional)"` to confirm the exact current line before editing, since earlier tasks in this plan add code above it)

**Interfaces:**
- Consumes: the existing `priceTiers` field array (`useFieldArray({ control: form.control, name: "priceTiers" })`, already present) and `priceTierItemSchema`'s fields (`titleEn`, `titleAr`, `descriptionEn`, `descriptionAr`, `price`, `currency`, `secondaryDisplayPrice`) — unchanged, this task only touches the JSX rendering, not the schema.
- Produces: no new interfaces — purely a visual/interaction rewrite of existing UI.

**Deliberate scope note:** the approved mockup shows a decorative six-dot drag handle in each row's header. This task does NOT implement real drag-and-drop reordering (no drag library exists in this codebase yet, and adding one is a real dependency decision outside this task's scope) — implementing a non-functional drag handle would be a UI lie. Instead, this task adds working "Move Up"/"Move Down" icon buttons in the expanded card's footer (next to Remove), and drops the decorative drag-handle icon from the collapsed row header entirely, keeping that header honest (icon chip, title, price pill, chevron only). If the user wants real drag-and-drop later, that is a separate, explicitly-scoped follow-up.

- [ ] **Step 1: Add collapse/expand state** — one `useState<Set<number>>` (or per-row boolean map) tracking which tier indices are expanded, initialized so index `0` (or all, if there are 2 or fewer tiers) starts expanded and the rest start collapsed on load (matches the mockup's "new tiers open expanded, existing ones start collapsed" behavior — approximate this by defaulting ALL rows to expanded on initial mount when `priceTiers.fields.length <= 1`, and collapsed otherwise; a newly-appended row should always open expanded, so the "Add Tier" button's `onClick` must also add the new index to the expanded set):

```tsx
const [expandedTiers, setExpandedTiers] = useState<Set<number>>(
  () => new Set(priceTiers.fields.length <= 1 ? priceTiers.fields.map((_, i) => i) : []),
);

function toggleTierExpanded(index: number) {
  setExpandedTiers((prev) => {
    const next = new Set(prev);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return next;
  });
}
```

Update the existing "Add Tier" button's `onClick` to also expand the new row (its index is `priceTiers.fields.length` at the moment of the click, before `append` runs):

```tsx
onClick={() => {
  const newIndex = priceTiers.fields.length;
  priceTiers.append({ titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "", price: 0, currency: "OMR", secondaryDisplayPrice: "" });
  setExpandedTiers((prev) => new Set(prev).add(newIndex));
}}
```

- [ ] **Step 2: Rewrite the per-tier card** to a collapsed-summary + expandable-detail structure, matching the approved mockup's visual language (rounded-xl white card, zinc borders, emerald icon chip, tabular-nums price pill, chevron rotation) — this is the ADMIN dashboard's light theme, distinct from the dark public frontend, so use `rounded-xl`/`border-zinc-200`/`bg-white`/emerald accents, NOT the public site's square-corner/hairline-border language from Task 11:

```tsx
{priceTiers.fields.map((field, index) => {
  const isExpanded = expandedTiers.has(index);
  const titleEn = form.watch(`priceTiers.${index}.titleEn`);
  const price = form.watch(`priceTiers.${index}.price`);
  const currency = form.watch(`priceTiers.${index}.currency`);
  const descriptionEn = form.watch(`priceTiers.${index}.descriptionEn`);
  return (
    <div key={field.id} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => toggleTierExpanded(index)}
        className="flex w-full items-center gap-3 p-3.5 text-left cursor-pointer"
      >
        <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[9px] border border-emerald-100 bg-emerald-50 text-emerald-600">
          <CircleDollarSign className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-zinc-900">
            {titleEn || `Tier ${index + 1}`}
          </span>
          {descriptionEn && (
            <span className="block truncate text-xs text-zinc-500">{descriptionEn}</span>
          )}
        </span>
        <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold tabular-nums text-emerald-700">
          {price || 0} {currency || "OMR"}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-zinc-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>
      {isExpanded && (
        <div className="border-t border-zinc-200 p-4 pt-4 space-y-3.5">
          {/* the existing title/description/price/currency/secondary-price field grid from the prior plan's Task 3 goes here unchanged, just re-indented under this new wrapper */}
          <div className="flex items-center justify-between border-t border-dashed border-zinc-200 pt-3.5 mt-3.5">
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer"
                disabled={index === 0}
                onClick={() => priceTiers.move(index, index - 1)}
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer"
                disabled={index === priceTiers.fields.length - 1}
                onClick={() => priceTiers.move(index, index + 1)}
              >
                <ChevronDown className="size-4" />
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer text-red-500 hover:text-red-600"
              onClick={() => priceTiers.remove(index)}
            >
              <HugeiconsIcon icon={Delete02Icon} className="mr-1.5" size={14} />
              Remove this tier
            </Button>
          </div>
        </div>
      )}
    </div>
  );
})}
```

(`priceTiers.move(from, to)` is `react-hook-form`'s built-in `useFieldArray` method — already available on the existing `priceTiers` field array object, no new import needed. `ChevronUp`/`ChevronDown`/`CircleDollarSign` from `lucide-react` — `ChevronDown` and `CircleDollarSign` are very likely already imported elsewhere in this file per the prior plan's research; `ChevronUp` may need adding to the existing `lucide-react` import statement if not already present — grep first.)

- [ ] **Step 3: Move the existing field grid (title EN/AR, description EN/AR, price/currency/secondary-price) inside the `isExpanded` block**, replacing the placeholder comment in Step 2 — this is a re-indent of code that already exists from the prior plan, not new field logic. Keep every `form.watch`/`form.setValue` call exactly as it was.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`. Manually trace: with `opex-2026`'s real 4 tiers, confirm the new collapse/expand state defaults to all-collapsed (since `priceTiers.fields.length` is 4, not `<= 1`), each collapsed row shows its real title + price pill, clicking a row expands it revealing all fields, "Add Tier" appends a new row that opens already-expanded, Move Up/Down reorders correctly (disabled at the first/last position), Remove deletes the row and collapses/removes its entry from `expandedTiers` implicitly (no dangling state reference since the Set only ever holds indices that get re-derived from `priceTiers.fields.map` on next render — confirm this doesn't cause a stale-index bug when removing a tier in the middle of the list: since indices shift after removal, the `expandedTiers` Set may now point at the wrong rows' expand state. Fix: after any `priceTiers.remove(index)` call, also strip that index from `expandedTiers` and shift down any indices greater than it, e.g. wrap the remove button's `onClick` to also call a small `setExpandedTiers` adjustment).

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/dashboard/events/_components/event-form.tsx"
git commit -m "feat: redesign admin Price Tiers editor as collapsible cards"
```

---

## Task 14: Sidebar CTA buttons — schema + admin UI + persistence

New feature added after the design review, alongside the pricing/downloads redesign (same sidebar area, same session). Admin can add optional extra CTA buttons to the public sidebar: bilingual label, a URL, and a primary/secondary style choice.

**Files:**
- Modify: `prisma/schema.prisma` (new `EventSidebarCta` model)
- Modify: `src/lib/events/event-form-visibility.ts` (add `"sidebarCtas"` to `EventFormSectionId`)
- Modify: `src/lib/events/event-form-rail.ts` (new rail group entry — this doesn't fit neatly under "Core"/"Experience"/"People"/"Operations"; add it to the `"experience"` group alongside `downloads`, since both are sidebar-facing content extras)
- Modify: `src/lib/events/event-form-health.ts` (add a `sidebarCtas` branch, optional/always-complete like `downloads`)
- Modify: `src/app/[locale]/dashboard/events/_components/event-form.tsx` (zod schema, `sections` array, new section content)
- Modify: `src/app/[locale]/dashboard/events/_actions.ts` (create/update persistence)
- Modify: `src/app/[locale]/dashboard/programs/[id]/page.tsx` (edit-page fetch + defaultValues — the exact same "separate query, must be wired or data silently wipes on save" gap the prior plan's Task 7 amendment fixed for tiers/contact numbers; do not skip this)
- Migration: generated by `npx prisma migrate dev`

**Interfaces:**
- Produces: `EventSidebarCta { id, eventId, labelEn, labelAr, url, style: "primary"|"secondary", order }`. `EventFormValues["sidebarCtas"]: { labelEn: string; labelAr: string; url: string; style: "primary" | "secondary" }[]`. Task 15 consumes this via the query layer.

- [ ] **Step 1: Add the Prisma model**

```prisma
model EventSidebarCta {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  labelEn   String
  labelAr   String
  url       String
  style     String   @default("secondary")
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([eventId])
}
```

Add `sidebarCtas EventSidebarCta[]` to `Event`'s relations block.

- [ ] **Step 2: Migrate**

Run: `npx prisma migrate dev --name add_event_sidebar_ctas`, then `npx prisma generate`. Confirm `src/generated/prisma/models/EventSidebarCta.ts` exists.

- [ ] **Step 3: Add `"sidebarCtas"` to `EventFormSectionId`** in `event-form-visibility.ts`, and to the `"experience"` group's `sectionIds` in `event-form-rail.ts` (alongside `downloads`).

- [ ] **Step 4: Add a `sidebarCtas` branch to `event-form-health.ts`** (same pattern as Task 6 Step 3's `downloads` branch — optional section, always `true` in `completionBySection`, error-filtered by `path.startsWith("sidebarCtas.")` in `errorCountBySection`).

- [ ] **Step 5: Add the zod schema, field array, and admin UI in `event-form.tsx`**

```ts
const sidebarCtaItemSchema = z.object({
  labelEn: z.string().min(1, "Label (English) is required"),
  labelAr: z.string().min(1, "Label (Arabic) is required"),
  url: z.string().min(1, "URL is required"),
  style: z.enum(["primary", "secondary"]),
});
```

Register `sidebarCtas: z.array(sidebarCtaItemSchema),` on `eventSchema`, `sidebarCtas: [],` in `initialFormValues`. Add `const sidebarCtas = useFieldArray({ control: form.control, name: "sidebarCtas" });`. Add `{ icon: SquareMousePointer, id: "sidebarCtas", label: "Sidebar CTAs" }` to the `sections` array (pick any reasonably-fitting `lucide-react` icon already imported, or add one — `SquareMousePointer`, `Link`, or `MousePointerClick` are all real `lucide-react` exports; confirm the exact one chosen isn't already imported under a conflicting name).

Section content (mirrors the Contact Numbers editor's field-array structure — label EN/AR inputs, a URL input, and a style `<select>`):

```tsx
{activeSection === "sidebarCtas" && (
  <FieldSet>
    <SectionHeader
      description="Extra buttons shown in the public sidebar, below Register."
      icon={SquareMousePointer}
      number="08"
      title="Sidebar CTAs"
    />
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() =>
            sidebarCtas.append({ labelEn: "", labelAr: "", url: "", style: "secondary" })
          }
        >
          Add CTA Button
        </Button>
      </div>
      {sidebarCtas.fields.map((field, index) => (
        <div key={field.id} className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Label (English)</Label>
              <Input
                value={form.watch(`sidebarCtas.${index}.labelEn`)}
                onChange={(e) => form.setValue(`sidebarCtas.${index}.labelEn`, e.target.value, { shouldDirty: true })}
                placeholder="View Sponsorship Pack"
              />
            </div>
            <div>
              <Label>Label (Arabic)</Label>
              <Input
                dir="rtl"
                value={form.watch(`sidebarCtas.${index}.labelAr`)}
                onChange={(e) => form.setValue(`sidebarCtas.${index}.labelAr`, e.target.value, { shouldDirty: true })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>URL</Label>
              <Input
                value={form.watch(`sidebarCtas.${index}.url`)}
                onChange={(e) => form.setValue(`sidebarCtas.${index}.url`, e.target.value, { shouldDirty: true })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Style</Label>
              <select
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                value={form.watch(`sidebarCtas.${index}.style`)}
                onChange={(e) =>
                  form.setValue(`sidebarCtas.${index}.style`, e.target.value as "primary" | "secondary", { shouldDirty: true })
                }
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="cursor-pointer"
            onClick={() => sidebarCtas.remove(index)}
          >
            <HugeiconsIcon icon={Delete02Icon} className="text-destructive" />
            Remove
          </Button>
        </div>
      ))}
    </div>
  </FieldSet>
)}
```

- [ ] **Step 6: Persist in `_actions.ts`** — nested create in `createEventAction` (alongside `downloads`), delete+recreate in `updateEventAction`:

```ts
// createEventAction, alongside the downloads nested-create:
      sidebarCtas:
        values.sidebarCtas.length > 0
          ? {
              create: values.sidebarCtas.map((c, i) => ({
                labelEn: c.labelEn,
                labelAr: c.labelAr,
                url: c.url,
                style: c.style,
                order: i,
              })),
            }
          : undefined,
```

```ts
// updateEventAction, alongside the downloads delete+recreate:
    await db.eventSidebarCta.deleteMany({ where: { eventId: id } });
    if (values.sidebarCtas.length > 0) {
      await db.eventSidebarCta.createMany({
        data: values.sidebarCtas.map((c, i) => ({
          eventId: id,
          labelEn: c.labelEn,
          labelAr: c.labelAr,
          url: c.url,
          style: c.style,
          order: i,
        })),
      });
    }
```

- [ ] **Step 7: Wire the admin edit page** (`programs/[id]/page.tsx`) — add `sidebarCtas: { orderBy: { order: "asc" } }` to the `include`, and to `defaultValues`:

```ts
    sidebarCtas: event.sidebarCtas.map((c) => ({
      labelEn: c.labelEn,
      labelAr: c.labelAr,
      url: c.url,
      style: c.style as "primary" | "secondary",
    })),
```

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit`. Same round-trip pattern as every other field array in this plan: create a disposable test event, add 2 CTA buttons (one primary, one secondary), save, confirm persistence via read-back, confirm editing without touching this section doesn't wipe it, clean up.

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma src/lib/events/event-form-visibility.ts src/lib/events/event-form-rail.ts src/lib/events/event-form-health.ts "src/app/[locale]/dashboard/events/_components/event-form.tsx" "src/app/[locale]/dashboard/events/_actions.ts" "src/app/[locale]/dashboard/programs/[id]/page.tsx"
git commit -m "feat: add Sidebar CTA buttons admin section and persistence"
```

---

## Task 15: Sidebar CTA buttons — query resolution + public rendering

**Files:**
- Modify: `src/lib/content/queries.ts`
- Modify: `src/app/[locale]/events/[slug]/page.tsx` (`RegisterCard`)
- Modify: `src/app/[locale]/training-courses/[slug]/page.tsx` (same)

**Interfaces:**
- Consumes: `EventSidebarCta` rows from Task 14.
- Produces: `EventDetail.sidebarCtas: { id: string; label: string; url: string; style: "primary" | "secondary" }[]`.

- [ ] **Step 1: Add `sidebarCtas: { orderBy: { order: "asc" } }` to `getEventDetailBySlug`'s `include`**, and resolve (label picked by locale, no cross-locale fallback, same rule as `contactNumbers`/`downloads`):

```ts
  const sidebarCtas = event.sidebarCtas.map((c) => ({
    id: c.id,
    label: locale === "ar" ? c.labelAr : c.labelEn,
    url: c.url,
    style: c.style as "primary" | "secondary",
  }));
```

Add `sidebarCtas` to the function's return object.

- [ ] **Step 2: Render in `RegisterCard`, between the register button/status block and the `DownloadsAccordion`** (per the design-review placement decision — extra CTAs are more prominent than the downloads accordion, so they sit above it):

```tsx
{event.sidebarCtas.map((cta) =>
  cta.style === "primary" ? (
    <Link
      key={cta.id}
      href={cta.url}
      className="mb-3 flex w-full items-center justify-center gap-2 bg-primary py-4 text-xs uppercase tracking-widest text-primary-foreground transition-colors hover:bg-secondary"
      target={cta.url.startsWith("http") ? "_blank" : undefined}
      rel={cta.url.startsWith("http") ? "noreferrer" : undefined}
    >
      {cta.label}
    </Link>
  ) : (
    <Link
      key={cta.id}
      href={cta.url}
      className="ghost-border mb-3 flex w-full items-center justify-center gap-2 py-4 text-xs uppercase tracking-widest transition-colors hover:bg-surface-container"
      target={cta.url.startsWith("http") ? "_blank" : undefined}
      rel={cta.url.startsWith("http") ? "noreferrer" : undefined}
    >
      {cta.label}
    </Link>
  ),
)}
<DownloadsAccordion downloads={event.downloads} eventId={event.id} locale={locale} />
```

(Primary style reuses the exact same visual treatment as the main Register button, since both are calls to action of equal visual weight; secondary reuses the `ghost-border` outline treatment already established by the old brochure link / new downloads accordion, so a secondary CTA doesn't visually compete with the primary Register action.)

- [ ] **Step 3: Repeat Steps 1-2 identically in `training-courses/[slug]/page.tsx`**

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`. Manually trace: with 0 CTA buttons (every event today, since this is brand new), confirm nothing renders differently from before this task. Add a disposable test CTA to a test event via admin, confirm it renders with the correct style (primary green-filled vs secondary outlined) between the Register button and the Downloads accordion.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/queries.ts "src/app/[locale]/events/[slug]/page.tsx" "src/app/[locale]/training-courses/[slug]/page.tsx"
git commit -m "feat: render sidebar CTA buttons on public event pages"
```

---

## Task 16: Final verification + cleanup sweep

**Files:**
- No new files — verification and a repo-wide grep sweep only.

**Interfaces:**
- Consumes: everything from Tasks 1-15.

- [ ] **Step 1: Repo-wide sweep for any remaining `brochureUrl` reference outside generated Prisma files**

Run: `grep -rn "brochureUrl" src/ --include="*.tsx" --include="*.ts" | grep -v "src/generated/"`
Expected: zero results. If any remain, they were missed in Task 4 — fix them now.

- [ ] **Step 2: Full check suite**

Run: `pnpm test:unit && npx tsc --noEmit`
Expected: all tests pass (7: 4 `resolveTierAmount` + 3 `getDownloadFileCategory`), zero type errors.

- [ ] **Step 3: Direct-DB end-to-end confirmation for `opex-2026`**

Scratch script calling `getEventDetailBySlug("en", "opex-2026", {...})` and `("ar", ...)`, printing `downloads`, `pricingHeading`, `priceTiers`, `sidebarCtas`. Confirm `downloads` has exactly the 1 migrated item, `pricingHeading` falls back to the default (unless a heading was set via admin during this plan's execution), `priceTiers` unaffected by this plan's changes (still the 4 real tiers from the prior plan), `sidebarCtas` is an empty array (nobody's added any yet). Delete the scratch script afterward.

- [ ] **Step 4: Manual/browser verification note**

If `pnpm dev` is runnable in the execution environment (check whether the pre-existing `@better-auth/*` install gap documented in the prior plan's ledger has been resolved since), do a real browser pass: load `/en/events/opex-2026` and `/ar/events/opex-2026`, confirm the sidebar date now shows "9 – 10 November 2026" (not just "9 November"), the Downloads accordion opens expanded by default and animates smoothly on toggle (chevron rotation, cascading item reveal — matching the approved interactive mockup), the pricing cards render with the new icon-chip/hairline-border design at the END of the page (after "Other Events"), the heading reads "Pricing" (or a custom value if set), the OMR glyph reads visibly bolder than before, and the admin Price Tiers editor shows collapsed rows with a live price pill that expand on click. If the environment still blocks browser verification, disclose this explicitly rather than skipping the note — this is the SECOND time this exact class of visual work has shipped without a live render check, and the user's own screenshots are what caught the last round's real bugs, so flag this prominently as a residual risk rather than treating the substituted verification as equivalent.

- [ ] **Step 5: Commit any final fixes discovered in Steps 1-4**

If Step 1's sweep or Step 2's suite surfaced anything, fix and commit with a clear message before considering the plan complete.

---

## Self-Review Notes

- **Spec coverage:** date-range fix (Task 1, a gap from the ORIGINAL request, folded in here since it touches the same files), `EventDownload` model + migration (Task 2-4), downloads admin UI (Task 6), downloads persistence (Task 7-8), downloads query resolution (Task 9), animated downloads public UI (Task 10), pricing card redesign (Task 11), editable heading (Task 6/9/11), placement move (Task 11), Bold currency glyph (Task 12), admin Price Tiers editor redesign (Task 13, added after design review), Sidebar CTA buttons feature (Tasks 14-15, added after design review). All spec goals plus both design-review add-ons covered.
- **Type consistency:** `downloadItemSchema`'s fields (`labelEn`, `labelAr`, `fileUrl`, `mimeType`) match exactly across Task 6 (schema), Task 7 (actions), Task 8 (edit page defaultValues), Task 9 (query resolution `{id, fileUrl, mimeType, label}` — note `label` singular/locale-resolved vs the admin's `labelEn`/`labelAr` pair, which is the intentional public/admin shape difference already established by the contact-numbers precedent), Task 10 (public consumption). `sidebarCtaItemSchema`'s fields (`labelEn`, `labelAr`, `url`, `style`) match identically across Task 14 (schema/actions/edit-page) and Task 15 (query resolution `{id, label, url, style}`, public consumption).
- **Non-additive migration called out explicitly**, not silently slipped in — Task 4 is clearly framed as a deliberate, spec-justified departure, with the data migration (Task 3) sequenced strictly before the column drop. Task 14's `EventSidebarCta` migration, by contrast, IS purely additive (new table only).
- **Design-review scope discipline**: Task 13 explicitly declines to implement real drag-and-drop (no library exists, would be a real new dependency) even though the approved mockup shows a drag handle — substitutes working Move Up/Down buttons instead and documents why, rather than shipping a decorative non-functional handle.
- **Open risk flagged, not hidden**: Task 16 Step 4 explicitly names that this is the second consecutive plan shipping visual work without live browser verification, and asks the executor to disclose rather than paper over that gap if it's still present.
