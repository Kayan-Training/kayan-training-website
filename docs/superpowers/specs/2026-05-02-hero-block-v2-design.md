# Hero Block v2 — Design Spec

**Goal:** Upgrade `hero` and `page_hero` block types to support multiple cycling media (images + video), multiple cycling text slides, full-viewport-height toggle, and overlay color/opacity controls.

**Architecture:** Type system changes in `block-types.ts` flow through to the page editor component. Old blocks stored in DB (single image/heading shape) are migrated in memory at load time via a utility — no DB migration required. Frontend rendering of cycling behaviour is out of scope for this spec.

**Tech Stack:** Next.js 16, React, Tailwind v4, shadcn/ui Switch, @dnd-kit/sortable (already installed), existing `fetchMediaAction` + `uploadMediaFile` utilities.

---

## 1. Updated Block Types

### `HeroMedia`
```ts
type HeroMedia = {
  id: string;   // nanoid(), generated client-side
  url: string;
  kind: "image" | "video";
};
```

### `HeroSlide` (for `hero` block — includes CTAs)
```ts
type HeroSlide = {
  id: string;
  heading: string;
  subheading: string;
  ctaText: string;
  ctaUrl: string;
};
```

### `PageHeroSlide` (for `page_hero` block — no CTAs)
```ts
type PageHeroSlide = {
  id: string;
  heading: string;
  subheading: string;
};
```

### Updated `HeroBlock`
```ts
type HeroBlock = {
  type: "hero";
  fullViewport: boolean;
  overlayColor: string;   // hex, e.g. "#000000"
  overlayOpacity: number; // 0–100
  media: HeroMedia[];
  slides: HeroSlide[];
};
```

### Updated `PageHeroBlock`
```ts
type PageHeroBlock = {
  type: "page_hero";
  eyebrow: string;
  fullViewport: boolean;
  overlayColor: string;
  overlayOpacity: number;
  media: HeroMedia[];
  slides: PageHeroSlide[];
};
```

---

## 2. In-memory Migration

Blocks are stored as opaque JSON in `PageTranslation.blocks`. Old hero blocks have the shape `{ type: "hero", image, heading, subheading, ctaText, ctaUrl }`.

A `migrateHeroBlock` utility runs when the page editor initialises its block list:

```ts
// src/lib/pages/migrate-blocks.ts
function migrateHeroBlock(raw: Record<string, unknown>): HeroBlock {
  // Already new shape
  if (Array.isArray(raw.slides)) return raw as unknown as HeroBlock;
  // Old shape → convert
  return {
    type: "hero",
    fullViewport: false,
    overlayColor: "#000000",
    overlayOpacity: 40,
    media: raw.image ? [{ id: nanoid(), url: raw.image as string, kind: "image" }] : [],
    slides: [{
      id: nanoid(),
      heading: (raw.heading as string) ?? "",
      subheading: (raw.subheading as string) ?? "",
      ctaText: (raw.ctaText as string) ?? "",
      ctaUrl: (raw.ctaUrl as string) ?? "",
    }],
  };
}

function migratePageHeroBlock(raw: Record<string, unknown>): PageHeroBlock {
  if (Array.isArray(raw.slides)) return raw as unknown as PageHeroBlock;
  return {
    type: "page_hero",
    eyebrow: (raw.eyebrow as string) ?? "",
    fullViewport: false,
    overlayColor: "#000000",
    overlayOpacity: 40,
    media: raw.image ? [{ id: nanoid(), url: raw.image as string, kind: "image" }] : [],
    slides: [{
      id: nanoid(),
      heading: (raw.heading as string) ?? "",
      subheading: (raw.subheading as string) ?? "",
    }],
  };
}
```

Called in `page-editor.tsx` during block initialisation from raw DB JSON.

---

## 3. Default block values

When adding a new `hero` or `page_hero` block via the Add Block menu:

```ts
// hero
{
  type: "hero",
  fullViewport: true,
  overlayColor: "#000000",
  overlayOpacity: 40,
  media: [],
  slides: [{ id: nanoid(), heading: "", subheading: "", ctaText: "", ctaUrl: "" }],
}

// page_hero
{
  type: "page_hero",
  eyebrow: "",
  fullViewport: true,
  overlayColor: "#000000",
  overlayOpacity: 40,
  media: [],
  slides: [{ id: nanoid(), heading: "", subheading: "" }],
}
```

---

## 4. Editor Components (page-editor.tsx)

### `MediaCarouselEditor`

Props: `media: HeroMedia[]`, `onChange: (media: HeroMedia[]) => void`

- Renders ordered list of media rows using `@dnd-kit/sortable`.
- Each row: drag handle | thumbnail (img tag for image, video tag poster for video) | `kind` badge | URL (truncated) | remove button.
- "Add from Library" button: calls `fetchMediaAction()`, opens `Dialog` with image grid (same pattern as existing `ImagePickerField`). On select, appends `{ id: nanoid(), url, kind: "image" }`.
- "Upload" button: file input (accepts `image/*,video/*`), calls `uploadMediaFile(file)` from `src/lib/client/media-upload.ts`. Detects kind from `file.type.startsWith("video/")`. Appends result on success.
- Video URLs: stored as plain URL string. Kind badge distinguishes image vs video for the frontend renderer.

### `SlideListEditor` (for `hero` — includes CTA fields)

Props: `slides: HeroSlide[]`, `onChange: (slides: HeroSlide[]) => void`, `dir: "ltr" | "rtl"`, `entities: LinkPickerEntities`

- Renders ordered list of slide cards.
- Each card: slide number header + drag handle + remove button | heading input | subheading input | CTA Text input | CTA URL via `LinkPickerInput`.
- "Add Slide" button appends a blank slide.
- Minimum 1 slide — remove button disabled when only 1 slide remains.
- DnD reorder via `@dnd-kit/sortable`.

### `PageHeroSlideListEditor` (for `page_hero` — no CTA fields)

Same as `SlideListEditor` but without CTA Text / CTA URL fields.

### Overlay + Viewport controls

Rendered in both `HeroBlockFields` and `PageHeroFields`:

```
┌─ Display ──────────────────────────────────────────────┐
│ [Switch] Full viewport height                          │
│ Overlay color   [████] #000000                         │
│ Overlay opacity [━━━━━━━━━━○──] 40%                    │
└────────────────────────────────────────────────────────┘
```

- `fullViewport`: shadcn `Switch` + label.
- `overlayColor`: `<input type="color">` with hex value readout.
- `overlayOpacity`: `<input type="range" min="0" max="100">` with live `{value}%` label.

---

## 5. Wireframe SVG update

The `BlockWireframe` component in `page-editor.tsx` has an SVG for `hero` and `page_hero`. These should be updated to suggest a carousel (show stacked image layers + text overlay) but this is cosmetic — update only if the existing SVG is significantly misleading.

---

## Out of scope

- Frontend rendering of cycling behaviour (separate frontend task).
- Video playback controls in the editor.
- Image cropping or resizing.
- Ordering media and slides in sync on the frontend.
