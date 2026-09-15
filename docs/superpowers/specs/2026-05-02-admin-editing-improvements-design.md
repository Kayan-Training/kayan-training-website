# Admin Editing Improvements — Design Spec

**Goal:** Upgrade three dashboard areas — Menus, Settings, and link URL fields — to be fully functional, production-grade, and consistent with the design system.

**Architecture:** Three self-contained improvements sharing one new reusable primitive (`LinkPickerInput`). The link picker is built first as a dependency; menus and settings are independent of each other after that.

**Tech Stack:** Next.js 16 App Router, React, shadcn/ui (Command, Popover, Switch), @dnd-kit/sortable (already installed), Prisma, server actions, Tailwind v4 design tokens.

---

## 1. LinkPickerInput Component

### Purpose
A URL input that lets users either type a manual URL or browse and select from existing Pages, Posts, and Events via a searchable Command popover. Replaces all plain `<input type="text">` URL fields across the dashboard.

### File
`src/components/ui/link-picker-input.tsx`

### Props
```ts
type EntityOption = { id: string; label: string; url: string };

type LinkPickerInputProps = {
  value: string;
  onChange: (url: string) => void;
  entities: {
    pages: EntityOption[];
    posts: EntityOption[];
    events: EntityOption[];
  };
  placeholder?: string;
  dir?: "ltr" | "rtl";
};
```

### Behaviour
- Renders a text `<input>` (controlled, `value`/`onChange`) + "Browse" button side by side.
- Typing in the input sets the URL directly (manual entry).
- "Browse" opens a `Popover` containing a shadcn `Command` component:
  - Search bar at top filters all three entity groups simultaneously.
  - Results grouped: **Pages**, **Posts**, **Events** — each item shows label + URL in muted text.
  - Clicking an item sets `value` to that entity's URL and closes the popover.
  - Empty state: "No results" message.
- Popover closes on outside click or Escape.

### Usage sites
- `src/app/[locale]/dashboard/menus/menu-item-list.tsx` — URL field in add-item form and inline edit form.
- `src/app/[locale]/dashboard/pages/_components/page-editor.tsx` — All CTA URL and link URL fields (`AboutIntro.ctaUrl`, `CtaBanner.buttonUrl`, `CtaBanner.linkUrl`, `HeroBlock.ctaUrl`, `CtaBlock.buttonUrl`).

---

## 2. Menus Page Overhaul

### Files modified
- `src/app/[locale]/dashboard/menus/page.tsx` — fix design tokens
- `src/app/[locale]/dashboard/menus/menu-item-list.tsx` — full rewrite
- `src/app/[locale]/dashboard/menus/_actions.ts` — add `updateMenuItem`

### Design token fixes
Replace all `zinc-*` and `teal-*` with design system tokens: `border-border/70`, `bg-card`, `bg-muted/20`, `text-muted-foreground`, `text-foreground`, `bg-primary`, `text-primary-foreground`.

### New `updateMenuItem` server action
```ts
export async function updateMenuItem(
  id: string,
  type: "link" | "page" | "post" | "event",
  labelEn: string,
  labelAr: string,
  url: string | null,
  targetId: string | null,
  locale: string,
): Promise<{ error?: string }>
```
Updates `type`, `url`, `targetId` on the `MenuItem` row and upserts both `MenuItemTranslation` rows. Revalidates the menus path.

### MenuItemList component rewrite

**Existing items list:**
- Each row: drag handle (wired to DnD) | label (EN / AR) | type badge | resolved URL | edit button | delete button.
- Drag handle uses `@dnd-kit/sortable` — `useSortable` per row, `DndContext` + `SortableContext` wrapping the list.
- On `dragEnd`: call `reorderMenuItems(newOrderIds, locale)` action.
- Edit button expands an inline edit form below the row (same fields as add-item form, pre-populated). Save calls `updateMenuItem`.

**Add-item form:**
- Link type selector: pill buttons (Manual URL / Page / Post / Event).
- Label fields: EN and AR side by side (both always visible, not tabbed).
- URL/target field: `LinkPickerInput` for all types — when type is Page/Post/Event, `entities` prop is passed so the browse popover shows relevant options; when type is Manual URL, entities still available but the user can type freely.
- "Add Item" button: disabled until both labels + URL/targetId are non-empty.

**Empty state:** If no menus exist in DB, show a banner explaining menus must be seeded via `npx prisma db seed`.

---

## 3. Settings Editor

### Files modified
- `src/app/[locale]/dashboard/settings/page.tsx` — convert to interactive editor
- `src/app/[locale]/dashboard/settings/_actions.ts` — new file
- `src/app/[locale]/dashboard/settings/_components/settings-form.tsx` — new client component

### Defined settings schema

```ts
type SettingField = {
  key: string;
  label: string;
  inputType: "text" | "email" | "tel" | "url" | "textarea";
};

const SETTINGS_SCHEMA: { group: string; fields: SettingField[] }[] = [
  {
    group: "Site",
    fields: [
      { key: "site.name",        label: "Site Name",        inputType: "text"     },
      { key: "site.tagline",     label: "Tagline",          inputType: "text"     },
      { key: "site.description", label: "Description",      inputType: "textarea" },
    ],
  },
  {
    group: "Contact",
    fields: [
      { key: "contact.email",   label: "Email",   inputType: "email"    },
      { key: "contact.phone",   label: "Phone",   inputType: "tel"      },
      { key: "contact.address", label: "Address", inputType: "textarea" },
    ],
  },
  {
    group: "Social",
    fields: [
      { key: "social.linkedin",  label: "LinkedIn",  inputType: "url" },
      { key: "social.twitter",   label: "X/Twitter", inputType: "url" },
      { key: "social.instagram", label: "Instagram",  inputType: "url" },
      { key: "social.youtube",   label: "YouTube",   inputType: "url" },
    ],
  },
];
```

Values are stored as JSON strings: `Setting.value = "\"some string\""`.

### Server action

```ts
// src/app/[locale]/dashboard/settings/_actions.ts
export async function upsertSettings(
  entries: { key: string; value: string }[],
): Promise<{ error?: string }>
```

Runs a Prisma `upsert` per entry. Each `value` stored as `JSON.stringify(stringValue)`.

### SettingsForm component

`"use client"` component. Props: `initialValues: Record<string, string>`.

- Renders `SETTINGS_SCHEMA` groups as cards.
- Each card has a "Save" button that submits only that group's fields via `useTransition` + `upsertSettings`.
- Success: `toast.success("Saved.")`. Error: `toast.error(result.error)`.
- Inputs: controlled state, initialised from `initialValues`.
- Unknown keys in DB (not in schema) are ignored by the UI.

### Page component

Server component reads all `Setting` rows, builds `initialValues: Record<string, string>` by parsing each `value` from JSON, renders `<SettingsForm initialValues={initialValues} />`.

---

## Error handling

- All server actions return `{ error?: string }` — client shows toast on error.
- `LinkPickerInput` handles empty entities arrays gracefully (shows "No results").
- Menus empty state explains DB seed requirement.

## Out of scope

- Menu item nesting/children (parentId exists in schema but not exposed in UI).
- Settings keys outside the defined schema.
- LinkPickerInput in non-dashboard contexts.
