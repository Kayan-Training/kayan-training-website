# SEO / AEO / GEO overhaul — design

Status: approved by user, pending spec review
Date: 2026-09-15
Driven by: a full technical SEO audit of the live site, prompted by the user noticing
a WhatsApp link-preview screenshot for a third-party (Platinumlist) listing of OPEX
2026 that looked far better than this site's own social previews.

## Problem

The audit (full findings retained in this session's history) found:

1. **No Twitter Card metadata anywhere.** Zero `twitter` metadata in any
   `generateMetadata`/`metadata` export across the app.
2. **OpenGraph coverage is inconsistent and mostly missing.** Only event and blog
   detail pages set `openGraph.images` at all, and even those use the raw uploaded
   cover photo with no branding overlay, no `width`/`height`/`alt`, no `siteName`,
   no `type`. Training-course detail pages, the home page, both root/locale layouts,
   all listing pages (events/training-courses/blog/knowledge), contact-us, and
   generic CMS pages have **no OpenGraph metadata at all** — link previews on these
   pages render with no image and often no description.
3. **No `seoImage` field exists on `Event` or `Page` translation models** —
   `PostTranslation` has one, but events and static pages have no way for an editor
   to set a dedicated share image; they'd have to reuse whatever raw photo was
   uploaded as the cover image.
4. **No site-wide `Organization`/`WebSite` JSON-LD**, no `BreadcrumbList` structured
   data (a breadcrumb UI component exists but every public page hand-rolls its own
   breadcrumb markup instead of using it, and none of them pair it with JSON-LD),
   no `FAQPage` schema.
5. **`Event`/`Course` JSON-LD is present but incomplete** — `Event` has no `offers`
   despite real `EventPriceTier` pricing data existing in the database; `Course` has
   no `hasCourseInstance` (Google's preferred way to expose course dates/pricing)
   and no `offers` either.
6. Smaller gaps: `sitemap.ts`'s `lastModified` for static paths is always
   `new Date()` (meaningless as a recrawl signal), `buildLocaleAlternates()` in
   `src/lib/seo.ts` is dead code (superseded by `buildMetadataWithLocaleAlternates`,
   which is what's actually used everywhere), no `llms.txt`, no `manifest.json`.

## Goals

1. Every page on the site gets a real, branded Open Graph + Twitter Card image and
   description — not a missing image, not a raw unbranded photo.
2. Editors can override the auto-generated share image per event/page (`Post`
   already supports this).
3. The site has real structured-data signals for its own identity (Organization,
   WebSite), its navigation (BreadcrumbList), and its commercial content (Event/
   Course pricing and instance data) — the concrete, data-backed wins available
   right now without inventing new content.
4. Small, correct fixes: real `lastModified` dates in the sitemap, removal of dead
   code, `llms.txt`, `manifest.json`.
5. Before the OG image template ships to every page type, the user reviews an
   actual generated image for the real OPEX 2026 event (not a mockup) and approves
   the visual direction.

## Non-goals

- **`FAQPage` schema.** No FAQ/Q&A content exists anywhere in the CMS or codebase.
  Adding this schema needs real authored content first — a content decision for the
  user to make separately, not something this plan can wire up from existing data.
  Not doing this now; flagged, not silently dropped.
- **Structured `PostalAddress` for Organization** beyond best-effort. The site's
  `contactAddress` setting is a single free-text localized string (no separate
  street/city/postal-code fields). This plan uses that string as-is inside a
  `PostalAddress` object with a hardcoded `addressCountry: "OM"` rather than
  inventing structured address data the CMS doesn't actually capture.
- **Rasterizing a new PNG logo asset.** The canonical logo (`public/brand/kayan-logo.svg`)
  is only available as SVG. Satori (which powers `ImageResponse`) renders inline
  `<svg>` JSX elements reliably, so the OG image template inlines the SVG markup
  directly rather than adding a new build step to generate a PNG export.
- **Restructuring the shared `Breadcrumb` UI component** (`src/components/ui/breadcrumb.tsx`).
  It's used only in the admin dashboard today; public pages hand-roll their own
  breadcrumb markup. `BreadcrumbList` JSON-LD is built directly from each public
  page's existing `{label, href}` data, not by retrofitting the shared component.

## Data model changes (`prisma/schema.prisma`)

Purely additive migration:

```prisma
// EventTranslation
  seoImage String?

// PageTranslation
  seoImage String?
```

(`PostTranslation.seoImage` already exists and is unaffected.)

## OG/Twitter image generation

**New font assets** (none exist in the repo today — the site currently loads fonts
only via `next/font/google`/CDN, which `ImageResponse` cannot use; it needs raw
`ttf`/`otf`/`woff` buffers):
- `assets/fonts/montserrat-bold.ttf` (or `.otf`) — matches the site's actual EN
  heading font (`--font-heading` override to Montserrat for `[data-locale="en"]`,
  per `globals.css`).
- `assets/fonts/ibm-plex-arabic-bold.ttf` — matches the site's actual AR heading
  font (`--font-ibm-plex-arabic`).
Both are open-license Google Fonts, downloaded once and committed as static files
(not fetched at request time).

**Shared OG image builder** (`src/lib/og/build-og-image.tsx` or similar): a single
function taking `{ title, subtitle?, backgroundImageUrl?, locale }` and returning
the `ImageResponse` JSX tree: full-bleed background image (or a dark solid fallback
when `backgroundImageUrl` is absent — home/listings/contact-us), the
`rgba(12,14,14,...)` gradient overlay from the real event hero (`events/[slug]/page.tsx`
line ~513), the inlined Kayan logo SVG, and title/subtitle text in the site's teal
accent color, using the correct font per locale. Reused by every route below rather
than duplicated per page type.

**Route files** (Next's file-convention, `next/og`'s `ImageResponse` — note this
fork's Next 16 receives `params` as a `Promise`, a real breaking change from what
older training data would expect):
- `src/app/[locale]/events/[slug]/opengraph-image.tsx` + `twitter-image.tsx` —
  title = event title, subtitle = formatted date + venue, background = 
  `event.seoImage || event.coverImage`.
- `src/app/[locale]/training-courses/[slug]/opengraph-image.tsx` + `twitter-image.tsx`
  — same pattern.
- `src/app/[locale]/blog/[slug]/opengraph-image.tsx` + `twitter-image.tsx` — title =
  post title, background = `post.seoImage || post.coverImage` (falls back to the
  shared no-background variant if neither exists).
- `src/app/[locale]/[page]/opengraph-image.tsx` + `twitter-image.tsx` — generic CMS
  pages, background = `page.seoImage` if set, else the no-background variant.
- `src/app/[locale]/opengraph-image.tsx` + `twitter-image.tsx` — one shared default
  (no background image, just the dark gradient + logo + site tagline) inherited by
  home, listing pages (events/training-courses/blog/knowledge), and contact-us,
  since none of these have a natural "hero photo" to use as a background.

**Metadata wiring**: every `generateMetadata` across these routes gets a proper
`openGraph` block (`title`, `description`, `type`, `siteName`, `locale`, and
`images` — Next auto-detects the sibling `opengraph-image` file convention so an
explicit `images` array isn't strictly required, but `alt` text should be set via
the sibling `opengraph-image.alt.txt` convention or the route's exported `alt`)
plus a `twitter` block (`card: "summary_large_image"`, matching `title`/`description`).

**Preview checkpoint**: implement the events route and the shared builder first,
generate the real image for `opex-2026` (via the actual running route, not a
mockup), and get the user's explicit approval before wiring the same builder to
training-courses/blog/pages/the shared default.

## Structured data

- **Organization + WebSite JSON-LD**, added to the root layout (rendered once,
  site-wide) via a new small helper in `src/lib/seo.ts`, sourced from
  `getLocalizedSiteSettings()`: `name` (siteName), `logo` (absolute URL to
  `/brand/kayan-logo.svg`), `contactPoint` (contactPhone/contactEmail), `address`
  (best-effort `PostalAddress` from the single `contactAddress` string, per the
  Non-goals note), `sameAs` (the settings' `socialLinks` array). `WebSite` adds
  `url` and a `SearchAction` pointing at the existing `/search` route.
- **BreadcrumbList JSON-LD** on events/training-courses/blog detail pages, built
  directly from each page's existing inline `{label, href}` breadcrumb data
  (Home → section → current item) — no new breadcrumb UI, just a parallel JSON-LD
  `<script>` emission alongside the existing `jsonLdScript()` pattern already used
  for `Event`/`Course`/`Article`.
- **`Event.offers`**: added to the existing `Event` JSON-LD builder, one `Offer`
  per real `EventPriceTier` (`price`, `priceCurrency` from the tier's `currency`
  field, `availability` inferred from `event.registrationsOpen`, `url` = the
  event's registration link). When an event has no tiers, fall back to a single
  `Offer` from the flat `event.price` (matching the public page's own existing
  0-tier fallback behavior).
- **`Course.hasCourseInstance` + `Course.offers`**: same tier-based `Offer`
  construction, plus a `CourseInstance` with `startDate`/`endDate`/`location`
  (already available on the `Event` row backing every training course, since both
  share the same underlying table per `eventKind`).

## Small fixes

- `src/app/sitemap.ts`: static paths' `lastModified` should reflect real
  content-change dates where available (e.g. the most recent `updatedAt` among
  featured/pinned content for listing pages) rather than `new Date()` on every
  build; where no meaningful date exists (e.g. the bare locale root), omit
  `lastModified` entirely rather than emitting a fake one.
- Remove the unused `buildLocaleAlternates()` from `src/lib/seo.ts` (confirmed
  dead code — `buildMetadataWithLocaleAlternates`, the absolute-URL version, is
  what's actually used everywhere).
- Add `src/app/llms.txt/route.ts` (or a static `public/llms.txt`) — a short,
  plain-text summary of what Kayan is, its main content sections (events, training
  courses, blog), and canonical URLs to those sections, per the emerging `llms.txt`
  convention for LLM crawlers.
- Add `src/app/manifest.ts` (Next's `MetadataRoute.Manifest` file convention) —
  `name`/`short_name` from site settings, `theme_color`/`background_color`
  matching the site's dark palette, icons referencing the existing
  `favicon.ico`/`icon.png`/`apple-icon.png`.

## Testing

- No existing automated test coverage is directly applicable to visual OG image
  output — verification is manual: load each route's `opengraph-image` URL
  directly in a browser (or via a script that renders and saves the `ImageResponse`
  output) and visually confirm text legibility, gradient/logo placement, and
  correct per-locale font rendering (including Arabic glyph rendering, which has no
  existing coverage in this codebase to compare against).
- JSON-LD additions are verifiable via Google's Rich Results Test / Schema.org
  validator against a running instance, or by asserting the shape of the JSON
  object each builder function returns (these are plain data-transform functions,
  cheap to unit test with Vitest — e.g. "given an event with 2 price tiers, `offers`
  has 2 entries with correct `price`/`priceCurrency`").
- Manual/browser verification is expected to work in this environment this time —
  unlike the two prior plans this session, no `@better-auth/*` install gap has been
  reported blocking `pnpm dev` recently. If it recurs, disclose it explicitly rather
  than silently falling back to code-only verification, per the pattern established
  (and criticized when skipped) earlier in this session.

## Rollout

Additive migration only (new nullable columns, no drops). New route files are
purely additive (new file conventions, don't touch existing page components except
to add `openGraph`/`twitter` metadata blocks and JSON-LD `<script>` emissions).
Sequenced with the OPEX-2026 preview checkpoint before broad rollout, per the
user's explicit request to see the real generated image before it goes everywhere.
