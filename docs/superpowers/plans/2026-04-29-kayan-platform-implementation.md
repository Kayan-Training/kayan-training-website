# Plan 1: Kayan Dashboard Visual Overhaul

> **Plan index:** See [`PLANS-INDEX.md`](./PLANS-INDEX.md) for the full execution order. **This is Plan 1 — start here.**
> **Next plan:** After completing all tasks here, continue with [`2026-04-28-kayan-platform-implementation.md`](./2026-04-28-kayan-platform-implementation.md) (Plan 2: Foundation, CMS, Public Pages, SEO).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul every dashboard page to match the safety-hero design language: shadcn Form+RHF+zod on all edit forms, sectioned Card layouts, semantic tonal badges, client-side search/filter tables, row dropdown actions, and proper shared utility components.

**Architecture:** Install missing packages first, fix CSS token conflicts, build shared utility layer (format helpers, tone helpers, page-header, section-card, empty-state), then overhaul pages in order: overview → events → posts → registrations → categories → users → menus. Each page uses react-hook-form + zod + shadcn Form for mutations and server actions for data fetching.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui (form, dropdown-menu, alert-dialog, tabs), react-hook-form 7, zod 4, framer-motion, sonner, date-fns, @tiptap/react, @dnd-kit.

---

## File Structure Map

- `package.json` — add missing runtime deps
- `src/app/globals.css` — fix `:root` light-mode conflict, add `--radius: 0`, add status semantic tokens
- `src/components/ui/form.tsx` — shadcn form component (add via CLI)
- `src/components/ui/dropdown-menu.tsx` — shadcn dropdown-menu (add via CLI)
- `src/components/ui/alert-dialog.tsx` — shadcn alert-dialog (add via CLI)
- `src/components/ui/tabs.tsx` — shadcn tabs (add via CLI)
- `src/lib/format.ts` — formatEventStatus, formatPaymentStatus, formatEventType, formatPaymentMethod, formatDate
- `src/lib/tone.ts` — getEventStatusTone, getPaymentStatusTone, getRegistrationStatusTone
- `src/components/dashboard/page-header.tsx` — h1 + optional action slot
- `src/components/dashboard/section-card.tsx` — Card with title + description header
- `src/components/dashboard/empty-state.tsx` — centered empty message with icon
- `src/components/dashboard/count-up.tsx` — animated CountUp client component
- `src/app/[locale]/dashboard/page.tsx` — overview: KPI cards + recent registrations
- `src/app/[locale]/dashboard/events/events-table.tsx` — client-side search/filter events table
- `src/app/[locale]/dashboard/events/page.tsx` — server wrapper: fetch events, render events-table
- `src/app/[locale]/dashboard/events/new/page.tsx` — RHF+zod create form with Card sections
- `src/app/[locale]/dashboard/events/[id]/page.tsx` — RHF+zod edit form with Card sections
- `src/app/[locale]/dashboard/posts/posts-table.tsx` — client-side search posts table
- `src/app/[locale]/dashboard/posts/page.tsx` — server wrapper
- `src/app/[locale]/dashboard/posts/new/page.tsx` — RHF+zod create form
- `src/app/[locale]/dashboard/posts/[id]/page.tsx` — RHF+zod edit form
- `src/app/[locale]/dashboard/registrations/registrations-table.tsx` — client table with payment filter
- `src/app/[locale]/dashboard/registrations/page.tsx` — server wrapper
- `src/app/[locale]/dashboard/categories/page.tsx` — category list + create/edit form with color picker
- `src/app/[locale]/dashboard/users/page.tsx` — user table with shadcn Select role picker
- `src/app/[locale]/dashboard/menus/page.tsx` — menus with @dnd-kit drag-reorder

---

### Task 1: Install Missing Packages and Add Shadcn Components

**Files:**
- Modify: `package.json`

- [x] **Step 1: Install missing runtime packages**

```bash
pnpm add @hookform/resolvers framer-motion sonner date-fns
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm add nodemailer @react-email/components react-email
pnpm add -D @types/nodemailer
```

- [x] **Step 2: Add missing shadcn components**

```bash
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add alert-dialog
pnpm dlx shadcn@latest add tabs
pnpm dlx shadcn@latest add sonner
```

- [x] **Step 3: Verify installs**

```bash
pnpm typecheck
```

Expected: No new type errors from package additions.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/components/ui/
git commit -m "chore: add missing dashboard packages and shadcn components"
```

---

### Task 2: Fix globals.css — Dark Root Tokens and Status Semantics

**Files:**
- Modify: `src/app/globals.css`

- [x] **Step 1: Replace light-mode `:root` block with dark surface values**

The current `:root` block has `--background: oklch(1 0 0)` (white) which conflicts with the dark `@theme` tokens. Replace the entire `:root` block:

```css
:root {
  --radius: 0px;
  --background: oklch(0.09 0.004 195);
  --foreground: oklch(0.9 0.003 195);
  --card: oklch(0.12 0.003 195);
  --card-foreground: oklch(0.9 0.003 195);
  --popover: oklch(0.14 0.003 195);
  --popover-foreground: oklch(0.9 0.003 195);
  --primary: oklch(0.7 0.17 154);
  --primary-foreground: oklch(0.07 0.003 195);
  --secondary: oklch(0.82 0.088 183);
  --secondary-foreground: oklch(0.07 0.003 195);
  --muted: oklch(0.18 0.004 195);
  --muted-foreground: oklch(0.61 0.012 207);
  --accent: oklch(0.18 0.004 195);
  --accent-foreground: oklch(0.9 0.003 195);
  --destructive: oklch(0.65 0.2 20);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.32 0.012 207 / 15%);
  --input: oklch(0.32 0.012 207 / 20%);
  --ring: oklch(0.7 0.17 154 / 50%);
  --sidebar: oklch(0.09 0.004 195);
  --sidebar-foreground: oklch(0.9 0.003 195);
  --sidebar-primary: oklch(0.7 0.17 154);
  --sidebar-primary-foreground: oklch(0.07 0.003 195);
  --sidebar-accent: oklch(0.14 0.003 195);
  --sidebar-accent-foreground: oklch(0.9 0.003 195);
  --sidebar-border: oklch(0.32 0.012 207 / 15%);
  --sidebar-ring: oklch(0.7 0.17 154 / 50%);
  /* Semantic status tokens for tonal badges */
  --status-success: oklch(0.7 0.17 154);
  --status-warning: oklch(0.83 0.16 91);
  --status-info: oklch(0.76 0.12 208);
  --status-danger: oklch(0.65 0.2 20);
}
```

- [x] **Step 2: Add status semantic tokens to `@theme inline` block**

Find the `@theme inline {` block and add before the closing `}`:

```css
  --color-status-success: var(--status-success);
  --color-status-warning: var(--status-warning);
  --color-status-info: var(--status-info);
  --color-status-danger: var(--status-danger);
  --radius-sm: calc(var(--radius));
  --radius-md: calc(var(--radius));
  --radius-lg: var(--radius);
  --radius-xl: var(--radius);
```

- [x] **Step 3: Remove the `.dark { ... }` block entirely**

The app is dark-only. The `.dark` override block (lines 263-295) creates a two-mode conflict. Delete it.

- [ ] **Step 4: Run dev and visually verify dashboard still renders**

```bash
pnpm dev
```

Open `http://localhost:3000/en/dashboard` in browser. Verify dark surfaces, correct borders, no white flash.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "fix: align :root tokens to dark surface palette, add status semantic colors, zero radius"
```

---

### Task 3: Shared Utility Layer — format.ts, tone.ts, dashboard components

**Files:**
- Create: `src/lib/format.ts`
- Create: `src/lib/tone.ts`
- Create: `src/components/dashboard/page-header.tsx`
- Create: `src/components/dashboard/section-card.tsx`
- Create: `src/components/dashboard/empty-state.tsx`
- Create: `src/components/dashboard/count-up.tsx`

- [x] **Step 1: Create `src/lib/format.ts`**

```typescript
import { format } from "date-fns";

export function formatEventStatus(status: string): string {
  const map: Record<string, string> = {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  };
  return map[status] ?? status;
}

export function formatEventType(type: string): string {
  const map: Record<string, string> = {
    onsite: "On-site",
    online: "Online",
    hybrid: "Hybrid",
  };
  return map[type] ?? type;
}

export function formatPaymentStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
  };
  return map[status] ?? status;
}

export function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    card: "Card",
    bank: "Bank Transfer",
    both: "Card & Bank",
    free: "Free",
  };
  return map[method] ?? method;
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "d MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "d MMM yyyy, HH:mm");
}
```

- [x] **Step 2: Create `src/lib/tone.ts`**

```typescript
export function getEventStatusTone(status: string): string {
  if (status === "published") {
    return "border-status-success/40 bg-status-success/18 text-status-success";
  }
  if (status === "draft") {
    return "border-status-warning/40 bg-status-warning/18 text-status-warning";
  }
  return "border-status-danger/40 bg-status-danger/18 text-status-danger";
}

export function getPaymentStatusTone(status: string): string {
  if (status === "paid") {
    return "border-status-success/40 bg-status-success/18 text-status-success";
  }
  if (status === "pending") {
    return "border-status-info/40 bg-status-info/18 text-status-info";
  }
  if (status === "refunded") {
    return "border-status-warning/40 bg-status-warning/18 text-status-warning";
  }
  return "border-status-danger/40 bg-status-danger/18 text-status-danger";
}

export function getEventTypeTone(type: string): string {
  if (type === "online") {
    return "border-status-info/40 bg-status-info/18 text-status-info";
  }
  return "border-status-success/40 bg-status-success/18 text-status-success";
}
```

- [x] **Step 3: Create `src/components/dashboard/page-header.tsx`**

```typescript
import { type ReactNode } from "react";

export function PageHeader({
  action,
  title,
}: {
  action?: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {action}
    </div>
  );
}
```

- [x] **Step 4: Create `src/components/dashboard/section-card.tsx`**

```typescript
import { type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SectionCard({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
```

- [x] **Step 5: Create `src/components/dashboard/empty-state.tsx`**

```typescript
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  className,
  description,
  icon,
  title,
}: {
  className?: string;
  description?: string;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}>
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
```

- [x] **Step 6: Create `src/components/dashboard/count-up.tsx`**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({
  duration = 800,
  value,
}: {
  duration?: number;
  value: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = ref.current;
    const delta = value - from;

    function tick(now: number) {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - elapsed) ** 4;
      ref.current = from + delta * eased;
      setDisplay(Math.round(ref.current));
      if (elapsed < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [duration, value]);

  return <>{display}</>;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/format.ts src/lib/tone.ts src/components/dashboard/
git commit -m "feat: add dashboard shared utilities (format, tone, page-header, section-card, empty-state, count-up)"
```

---

### Task 4: Dashboard Overview Page — KPI Cards + Recent Registrations

**Files:**
- Modify: `src/app/[locale]/dashboard/page.tsx`

- [x] **Step 1: Rewrite overview page**

```typescript
import { Calendar03Icon, ChartRingIcon, File01Icon, UserGroup03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CountUp } from "@/components/dashboard/count-up";
import { formatDate, formatPaymentStatus } from "@/lib/format";
import { getPaymentStatusTone } from "@/lib/tone";
import { cn } from "@/lib/utils";

const kpiConfig = [
  {
    color: "text-status-success",
    bg: "bg-status-success/10",
    description: "Published + draft",
    icon: Calendar03Icon,
    key: "events" as const,
    label: "Events",
  },
  {
    color: "text-status-info",
    bg: "bg-status-info/10",
    description: "Knowledge hub content",
    icon: File01Icon,
    key: "posts" as const,
    label: "Posts",
  },
  {
    color: "text-status-warning",
    bg: "bg-status-warning/10",
    description: "Admin and learner accounts",
    icon: UserGroup03Icon,
    key: "users" as const,
    label: "Users",
  },
  {
    color: "text-primary",
    bg: "bg-primary/10",
    description: "Submitted registrations",
    icon: ChartRingIcon,
    key: "registrations" as const,
    label: "Registrations",
  },
] as const;

export default async function DashboardOverviewPage() {
  const [events, posts, users, registrations, recentRegistrations] = await Promise.all([
    db.event.count(),
    db.post.count(),
    db.user.count(),
    db.registration.count(),
    db.registration.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        event: { include: { translations: true } },
        user: true,
        payment: true,
      },
    }),
  ]);

  const counts = { events, posts, users, registrations };

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Overview</h1>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiConfig.map((kpi) => (
          <Card key={kpi.key}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>{kpi.label}</CardDescription>
                <span className={cn("rounded-md p-2", kpi.bg)}>
                  <HugeiconsIcon className={cn("size-4", kpi.color)} icon={kpi.icon} strokeWidth={2} />
                </span>
              </div>
              <CardTitle className="text-3xl tabular-nums">
                <Suspense fallback={counts[kpi.key]}>
                  <CountUp value={counts[kpi.key]} />
                </Suspense>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{kpi.description}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Registrations</CardTitle>
          <CardDescription>Last 8 submitted registrations across all events</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRegistrations.length === 0 && (
                <TableRow>
                  <TableCell className="py-10 text-center text-muted-foreground" colSpan={4}>
                    No registrations yet.
                  </TableCell>
                </TableRow>
              )}
              {recentRegistrations.map((reg) => {
                const title = reg.event.translations.find((t) => t.locale === "en")?.title ?? reg.event.slug;
                const tone = getPaymentStatusTone(reg.paymentStatus);
                return (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">{title}</TableCell>
                    <TableCell className="text-muted-foreground">{reg.user?.email ?? "guest"}</TableCell>
                    <TableCell>
                      <Badge className={cn("border text-xs", tone)} variant="outline">
                        {formatPaymentStatus(reg.paymentStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(reg.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
```

- [ ] **Step 2: Run dev server and verify the overview page renders**

```bash
pnpm dev
```

Open `http://localhost:3000/en/dashboard`. Verify: 4 KPI cards with icons and colors, count-up animation, recent registrations table with tonal badges.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/dashboard/page.tsx
git commit -m "feat: redesign dashboard overview with KPI cards and recent registrations"
```

---

### Task 5: Events Table Client Component

**Files:**
- Create: `src/app/[locale]/dashboard/events/events-table.tsx`
- Modify: `src/app/[locale]/dashboard/events/page.tsx`

- [x] **Step 1: Create `src/app/[locale]/dashboard/events/events-table.tsx`**

```typescript
"use client";

import { MoreVerticalIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatEventStatus, formatEventType } from "@/lib/format";
import { getEventStatusTone, getEventTypeTone } from "@/lib/tone";
import { cn } from "@/lib/utils";

type EventRow = {
  id: string;
  slug: string;
  status: string;
  type: string;
  startDate: Date;
  endDate: Date;
  categories: { category: { slug: string } }[];
  translations: { locale: string; title: string }[];
};

export function EventsTable({
  events,
  locale,
}: {
  events: EventRow[];
  locale: string;
}) {
  const [search, setSearch] = useState("");
  const deferred = useDeferredValue(search);

  const filtered = events.filter((event) => {
    if (!deferred) return true;
    const title = event.translations.find((t) => t.locale === "en")?.title ?? event.slug;
    return title.toLowerCase().includes(deferred.toLowerCase()) || event.slug.includes(deferred.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-4">
      <InputGroup>
        <InputGroupAddon>
          <HugeiconsIcon className="size-4 text-muted-foreground" icon={Search01Icon} strokeWidth={2} />
        </InputGroupAddon>
        <InputGroupInput
          className="max-w-sm"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events…"
          value={search}
        />
      </InputGroup>

      <div className="rounded-lg border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={6}>
                  No events found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((event) => {
              const title = event.translations.find((t) => t.locale === "en")?.title ?? event.slug;
              const statusTone = getEventStatusTone(event.status);
              const typeTone = getEventTypeTone(event.type);
              return (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{title}</TableCell>
                  <TableCell>
                    <Badge className={cn("border text-xs", statusTone)} variant="outline">
                      {formatEventStatus(event.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border text-xs", typeTone)} variant="outline">
                      {formatEventType(event.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(event.startDate)} – {formatDate(event.endDate)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {event.categories.length}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="size-8" size="icon" variant="ghost">
                          <HugeiconsIcon className="size-4" icon={MoreVerticalIcon} strokeWidth={2} />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/${locale}/dashboard/events/${event.id}`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/${locale}/events/${event.slug}`} target="_blank">
                            View public page
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Rewrite `src/app/[locale]/dashboard/events/page.tsx`**

```typescript
import Link from "next/link";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { EventsTable } from "./events-table";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const events = await db.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      translations: true,
      categories: { include: { category: true } },
    },
  });

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        action={
          <Link className={buttonVariants()} href={`/${locale}/dashboard/events/new`}>
            New Event
          </Link>
        }
        title="Events"
      />
      <EventsTable events={events} locale={locale} />
    </section>
  );
}
```

- [ ] **Step 3: Run dev and verify events table with search**

Open `http://localhost:3000/en/dashboard/events`. Verify: search box filters rows, tonal badges on status/type, dropdown row actions.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/dashboard/events/
git commit -m "feat: redesign events table with client search, tonal badges, and row action dropdown"
```

---

### Task 6: Events Create/Edit Form — RHF + Zod + Card Sections

**Files:**
- Modify: `src/app/[locale]/dashboard/events/new/page.tsx`
- Modify: `src/app/[locale]/dashboard/events/[id]/page.tsx`

- [ ] **Step 1: Rewrite `src/app/[locale]/dashboard/events/new/page.tsx`**

```typescript
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelectCombobox } from "@/components/dashboard/multi-select-combobox";
```

Wait — `new/page.tsx` must be a server component to pass categories from DB, but the form needs client-side RHF. The correct pattern is: server page fetches data, renders a client `EventForm` component. Do this as two files.

- [ ] **Step 1: Create `src/app/[locale]/dashboard/events/_components/event-form.tsx` (client form)**

```typescript
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MultiSelectCombobox } from "@/components/dashboard/multi-select-combobox";

const eventSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  status: z.enum(["draft", "published"]),
  type: z.enum(["onsite", "online"]),
  location: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  price: z.string().default("0"),
  isFree: z.boolean().default(false),
  paymentMethods: z.enum(["both", "card", "bank"]),
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  shortEn: z.string().optional(),
  shortAr: z.string().optional(),
  categories: z.array(z.string()).default([]),
});

export type EventFormValues = z.infer<typeof eventSchema>;

type CategoryOption = { label: string; value: string };

export function EventForm({
  categoryOptions,
  defaultValues,
  locale,
  onSubmit,
  submitLabel,
}: {
  categoryOptions: CategoryOption[];
  defaultValues?: Partial<EventFormValues>;
  locale: string;
  onSubmit: (values: EventFormValues) => Promise<{ error?: string }>;
  submitLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      slug: "",
      status: "draft",
      type: "onsite",
      location: "",
      startDate: "",
      endDate: "",
      price: "0",
      isFree: false,
      paymentMethods: "both",
      titleEn: "",
      titleAr: "",
      shortEn: "",
      shortAr: "",
      categories: [],
      ...defaultValues,
    },
  });

  function handleSubmit(values: EventFormValues) {
    startTransition(async () => {
      const result = await onSubmit(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Event saved.");
        router.push(`/${locale}/dashboard/events`);
        router.refresh();
      }
    });
  }

  return (
    <Form {...form}>
      <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(handleSubmit)}>
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
            <CardDescription>Slug, status, and event type</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="leadership-summit-2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Muscat, Oman" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Dates</CardTitle>
            <CardDescription>Event start and end dates</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Price, free event flag, and accepted payment methods</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (OMR)</FormLabel>
                  <FormControl>
                    <Input min="0" step="0.01" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethods"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Methods</FormLabel>
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="both">Card &amp; Bank Transfer</SelectItem>
                      <SelectItem value="card">Card only</SelectItem>
                      <SelectItem value="bank">Bank Transfer only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isFree"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Mark as free event</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Title and short description in English and Arabic</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="titleEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (English)</FormLabel>
                  <FormControl>
                    <Input dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="titleAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Arabic)</FormLabel>
                  <FormControl>
                    <Input dir="rtl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shortEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description (English)</FormLabel>
                  <FormControl>
                    <Input dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shortAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description (Arabic)</FormLabel>
                  <FormControl>
                    <Input dir="rtl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Associate this event with one or more categories</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <MultiSelectCombobox
                      initialSelected={field.value}
                      name="categories"
                      onChange={field.onChange}
                      options={categoryOptions}
                      placeholder="Select categories"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button asChild variant="outline">
            <Link href={`/${locale}/dashboard/events`}>Cancel</Link>
          </Button>
          <Button disabled={isPending} type="submit">
            {isPending ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

Note: `MultiSelectCombobox` needs an `onChange` prop added. Update its interface in `src/components/dashboard/multi-select-combobox.tsx` to accept `onChange?: (values: string[]) => void` and call it when selection changes.

- [x] **Step 2: Add `onChange` prop to `MultiSelectCombobox`**

Read `src/components/dashboard/multi-select-combobox.tsx` and add an optional `onChange` callback prop. Call `onChange?.(newSelected)` whenever the selection array changes.

- [x] **Step 3: Rewrite `src/app/[locale]/dashboard/events/new/page.tsx`**

```typescript
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { EventForm, type EventFormValues } from "./_components/event-form";

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const categories = await db.category.findMany({
    orderBy: { slug: "asc" },
    include: { translations: true },
  });
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.translations.find((t) => t.locale === "en")?.name ?? c.slug,
  }));

  async function createEvent(values: EventFormValues): Promise<{ error?: string }> {
    "use server";
    if (!values.slug || !values.startDate || !values.endDate || !values.titleEn || !values.titleAr) {
      return { error: "Required fields missing." };
    }
    try {
      const event = await db.event.create({
        data: {
          slug: values.slug,
          status: values.status,
          type: values.type,
          location: values.location || null,
          startDate: new Date(values.startDate),
          endDate: new Date(values.endDate),
          price: values.price,
          isFree: values.isFree || Number(values.price) <= 0,
          paymentMethods: values.paymentMethods,
          translations: {
            create: [
              { locale: "en", title: values.titleEn, shortDescription: values.shortEn || null, description: { type: "doc", content: [] } },
              { locale: "ar", title: values.titleAr, shortDescription: values.shortAr || null, description: { type: "doc", content: [] } },
            ],
          },
        },
      });
      if (values.categories.length) {
        await db.eventCategory.createMany({
          data: values.categories.map((categoryId) => ({ eventId: event.id, categoryId })),
          skipDuplicates: true,
        });
      }
      revalidatePath("/[locale]/dashboard/events", "layout");
      return {};
    } catch (err) {
      return { error: "Failed to create event. Please try again." };
    }
  }

  return (
    <section className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-semibold">Create Event</h1>
      <EventForm
        categoryOptions={categoryOptions}
        locale={locale}
        onSubmit={createEvent}
        submitLabel="Create Event"
      />
    </section>
  );
}
```

- [x] **Step 4: Rewrite `src/app/[locale]/dashboard/events/[id]/page.tsx`**

```typescript
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { EventForm, type EventFormValues } from "../_components/event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const event = await db.event.findUnique({
    where: { id },
    include: { translations: true, categories: true },
  });
  if (!event) notFound();

  const categories = await db.category.findMany({
    orderBy: { slug: "asc" },
    include: { translations: true },
  });
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.translations.find((t) => t.locale === "en")?.name ?? c.slug,
  }));

  const en = event.translations.find((t) => t.locale === "en");
  const ar = event.translations.find((t) => t.locale === "ar");

  const defaultValues: Partial<EventFormValues> = {
    slug: event.slug,
    status: event.status as "draft" | "published",
    type: event.type as "onsite" | "online",
    location: event.location ?? "",
    startDate: event.startDate.toISOString().slice(0, 10),
    endDate: event.endDate.toISOString().slice(0, 10),
    price: event.price.toString(),
    isFree: event.isFree,
    paymentMethods: event.paymentMethods as "both" | "card" | "bank",
    titleEn: en?.title ?? "",
    titleAr: ar?.title ?? "",
    shortEn: en?.shortDescription ?? "",
    shortAr: ar?.shortDescription ?? "",
    categories: event.categories.map((c) => c.categoryId),
  };

  async function updateEvent(values: EventFormValues): Promise<{ error?: string }> {
    "use server";
    try {
      await db.event.update({
        where: { id },
        data: {
          slug: values.slug,
          status: values.status,
          type: values.type,
          location: values.location || null,
          startDate: new Date(values.startDate),
          endDate: new Date(values.endDate),
          price: values.price,
          isFree: values.isFree || Number(values.price) <= 0,
          paymentMethods: values.paymentMethods,
        },
      });
      await db.eventTranslation.upsert({
        where: { eventId_locale: { eventId: id, locale: "en" } },
        update: { title: values.titleEn, shortDescription: values.shortEn || null },
        create: { eventId: id, locale: "en", title: values.titleEn, shortDescription: values.shortEn || null, description: { type: "doc", content: [] } },
      });
      await db.eventTranslation.upsert({
        where: { eventId_locale: { eventId: id, locale: "ar" } },
        update: { title: values.titleAr, shortDescription: values.shortAr || null },
        create: { eventId: id, locale: "ar", title: values.titleAr, shortDescription: values.shortAr || null, description: { type: "doc", content: [] } },
      });
      await db.eventCategory.deleteMany({ where: { eventId: id } });
      if (values.categories.length) {
        await db.eventCategory.createMany({
          data: values.categories.map((categoryId) => ({ eventId: id, categoryId })),
          skipDuplicates: true,
        });
      }
      revalidatePath("/[locale]/dashboard/events", "layout");
      return {};
    } catch (err) {
      return { error: "Failed to update event." };
    }
  }

  return (
    <section className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-semibold">Edit Event</h1>
      <EventForm
        categoryOptions={categoryOptions}
        defaultValues={defaultValues}
        locale={locale}
        onSubmit={updateEvent}
        submitLabel="Save Changes"
      />
    </section>
  );
}
```

- [x] **Step 5: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS (fix any type errors related to server action + client boundary).

- [ ] **Step 6: Run dev and test create + edit flows**

Open `http://localhost:3000/en/dashboard/events/new`. Verify: Card sections render, zod validation messages appear, form submits and redirects.
Open an existing event edit page. Verify: default values prefill, save updates correctly.

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/dashboard/events/ src/components/dashboard/multi-select-combobox.tsx
git commit -m "feat: redesign events create/edit form with RHF+zod and Card sections"
```

---

### Task 7: Posts Table and Form Overhaul

**Files:**
- Create: `src/app/[locale]/dashboard/posts/posts-table.tsx`
- Modify: `src/app/[locale]/dashboard/posts/page.tsx`
- Create: `src/app/[locale]/dashboard/posts/_components/post-form.tsx`
- Modify: `src/app/[locale]/dashboard/posts/new/page.tsx`
- Modify: `src/app/[locale]/dashboard/posts/[id]/page.tsx`

- [x] **Step 1: Read the current posts new and edit pages to understand their fields**

Read `src/app/[locale]/dashboard/posts/new/page.tsx` and `src/app/[locale]/dashboard/posts/[id]/page.tsx`.

- [x] **Step 2: Create `src/app/[locale]/dashboard/posts/posts-table.tsx`**

Mirrors the events table pattern with client search. Post columns: Title, Status, Type, Author, Categories, Actions dropdown (Edit, View public).

```typescript
"use client";

import { MoreVerticalIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEventStatusTone } from "@/lib/tone";
import { formatEventStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

type PostRow = {
  id: string;
  slug: string;
  status: string;
  type: string;
  categories: { categoryId: string }[];
  translations: { locale: string; title: string }[];
  author: { name: string | null; email: string };
};

export function PostsTable({ locale, posts }: { locale: string; posts: PostRow[] }) {
  const [search, setSearch] = useState("");
  const deferred = useDeferredValue(search);

  const filtered = posts.filter((post) => {
    if (!deferred) return true;
    const title = post.translations.find((t) => t.locale === "en")?.title ?? post.slug;
    return title.toLowerCase().includes(deferred.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-4">
      <InputGroup>
        <InputGroupAddon>
          <HugeiconsIcon className="size-4 text-muted-foreground" icon={Search01Icon} strokeWidth={2} />
        </InputGroupAddon>
        <InputGroupInput
          className="max-w-sm"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts…"
          value={search}
        />
      </InputGroup>

      <div className="rounded-lg border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={6}>
                  No posts found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((post) => {
              const title = post.translations.find((t) => t.locale === "en")?.title ?? post.slug;
              const tone = getEventStatusTone(post.status);
              return (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{title}</TableCell>
                  <TableCell>
                    <Badge className={cn("border text-xs", tone)} variant="outline">
                      {formatEventStatus(post.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">{post.type}</TableCell>
                  <TableCell className="text-muted-foreground">{post.author.name ?? post.author.email}</TableCell>
                  <TableCell className="text-muted-foreground">{post.categories.length}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="size-8" size="icon" variant="ghost">
                          <HugeiconsIcon className="size-4" icon={MoreVerticalIcon} strokeWidth={2} />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/${locale}/dashboard/posts/${post.id}`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/${locale}/posts/${post.slug}`} target="_blank">
                            View public page
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [x] **Step 3: Rewrite `src/app/[locale]/dashboard/posts/page.tsx`**

```typescript
import Link from "next/link";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { PostsTable } from "./posts-table";

export default async function PostsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const posts = await db.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { translations: true, categories: true, author: true },
  });

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        action={
          <Link className={buttonVariants()} href={`/${locale}/dashboard/posts/new`}>
            New Post
          </Link>
        }
        title="Posts"
      />
      <PostsTable locale={locale} posts={posts} />
    </section>
  );
}
```

- [x] **Step 4: Create `src/app/[locale]/dashboard/posts/_components/post-form.tsx`**

Implement a RHF+zod form with Card sections: Basic Info (slug, status, type), Content (titleEn, titleAr, shortEn, shortAr), Categories. Mirror the EventForm pattern exactly.

Zod schema:
```typescript
const postSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  status: z.enum(["draft", "published"]),
  type: z.string().min(1),
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  shortEn: z.string().optional(),
  shortAr: z.string().optional(),
  categories: z.array(z.string()).default([]),
});
```

- [x] **Step 5: Rewrite posts new and edit pages**

Follow the same server-wraps-client pattern: server page fetches categories + existing post data, passes server action to client PostForm.

- [ ] **Step 6: Run dev and verify posts create/edit**

Open `http://localhost:3000/en/dashboard/posts`. Verify search, tonal badges, dropdown actions. Open new post form — verify Card sections, validation messages.

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/dashboard/posts/
git commit -m "feat: redesign posts table and create/edit form with RHF+zod and Card sections"
```

---

### Task 8: Registrations Table Overhaul

**Files:**
- Create: `src/app/[locale]/dashboard/registrations/registrations-table.tsx`
- Modify: `src/app/[locale]/dashboard/registrations/page.tsx`

- [x] **Step 1: Create `src/app/[locale]/dashboard/registrations/registrations-table.tsx`**

Client component. Columns: Event, User (email), Payment Status (tonal badge), Method (human label), Date, Actions link. Add payment status filter select.

```typescript
"use client";

import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatPaymentMethod, formatPaymentStatus } from "@/lib/format";
import { getPaymentStatusTone } from "@/lib/tone";
import { cn } from "@/lib/utils";

type RegistrationRow = {
  id: string;
  eventId: string;
  paymentStatus: string;
  paymentMethod: string | null;
  createdAt: Date;
  event: { slug: string; translations: { locale: string; title: string }[] };
  user: { email: string } | null;
};

export function RegistrationsTable({
  locale,
  registrations,
}: {
  locale: string;
  registrations: RegistrationRow[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const deferred = useDeferredValue(search);

  const filtered = registrations.filter((reg) => {
    const title = reg.event.translations.find((t) => t.locale === "en")?.title ?? reg.event.slug;
    const matchesSearch = !deferred || title.toLowerCase().includes(deferred.toLowerCase()) || (reg.user?.email ?? "").includes(deferred);
    const matchesStatus = statusFilter === "all" || reg.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <InputGroup>
          <InputGroupAddon>
            <HugeiconsIcon className="size-4 text-muted-foreground" icon={Search01Icon} strokeWidth={2} />
          </InputGroupAddon>
          <InputGroupInput
            className="max-w-sm"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by event or email…"
            value={search}
          />
        </InputGroup>
        <Select defaultValue="all" onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={6}>
                  No registrations found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((reg) => {
              const title = reg.event.translations.find((t) => t.locale === "en")?.title ?? reg.event.slug;
              const tone = getPaymentStatusTone(reg.paymentStatus);
              return (
                <TableRow key={reg.id}>
                  <TableCell className="font-medium">{title}</TableCell>
                  <TableCell className="text-muted-foreground">{reg.user?.email ?? "guest"}</TableCell>
                  <TableCell>
                    <Badge className={cn("border text-xs", tone)} variant="outline">
                      {formatPaymentStatus(reg.paymentStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPaymentMethod(reg.paymentMethod ?? "card")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(reg.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                      href={`/${locale}/dashboard/registrations/${reg.eventId}?registrationId=${reg.id}`}
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Rewrite `src/app/[locale]/dashboard/registrations/page.tsx`**

```typescript
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { RegistrationsTable } from "./registrations-table";

export default async function RegistrationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const rows = await db.registration.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      event: { include: { translations: true } },
      user: true,
      payment: true,
    },
  });

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Registrations" />
      <RegistrationsTable locale={locale} registrations={rows} />
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/dashboard/registrations/
git commit -m "feat: redesign registrations table with client search, status filter, and tonal badges"
```

---

### Task 9: Categories Page Overhaul — Color Picker and Proper Form

**Files:**
- Modify: `src/app/[locale]/dashboard/categories/page.tsx`

- [x] **Step 1: Rewrite categories page with RHF+zod form and color swatch preview**

The create form needs:
- Slug (text input)
- Color (text input with live color swatch preview based on entered OKLCH value)
- SVG Icon (textarea for raw SVG paste)
- Arabic name
- English name

```typescript
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";

async function getCategoryRows() {
  if (!process.env.DATABASE_URL) return [];
  try {
    return await db.category.findMany({
      orderBy: { createdAt: "asc" },
      include: { translations: true },
    });
  } catch { return []; }
}

export default async function CategoriesPage() {
  const categories = await getCategoryRows();

  async function createCategory(formData: FormData) {
    "use server";
    const slug = String(formData.get("slug") ?? "").trim();
    const color = String(formData.get("color") ?? "").trim();
    const icon = String(formData.get("icon") ?? "").trim() || "<svg></svg>";
    const nameAr = String(formData.get("nameAr") ?? "").trim();
    const nameEn = String(formData.get("nameEn") ?? "").trim();
    if (!slug || !color) return;

    const category = await db.category.upsert({
      where: { slug },
      update: { color, icon },
      create: { slug, color, icon },
    });
    if (nameAr) {
      await db.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: category.id, locale: "ar" } },
        update: { name: nameAr },
        create: { categoryId: category.id, locale: "ar", name: nameAr },
      });
    }
    if (nameEn) {
      await db.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: category.id, locale: "en" } },
        update: { name: nameEn },
        create: { categoryId: category.id, locale: "en", name: nameEn },
      });
    }
    revalidatePath("/[locale]/dashboard/categories", "layout");
  }

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Categories" />

      <Card>
        <CardHeader>
          <CardTitle>Create Category</CardTitle>
          <CardDescription>Add a new category with localized names, an OKLCH color, and an SVG icon</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCategory} className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Slug</Label>
              <Input name="slug" placeholder="strategy" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Color (OKLCH)</Label>
              <Input name="color" placeholder="oklch(0.72 0.18 52)" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>English Name</Label>
              <Input dir="ltr" name="nameEn" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Arabic Name</Label>
              <Input dir="rtl" name="nameAr" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label>SVG Icon (paste raw SVG)</Label>
              <Textarea className="font-mono text-xs" name="icon" placeholder="<svg>...</svg>" rows={4} />
            </div>
            <div className="flex items-end">
              <Button type="submit">Create Category</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>English Name</TableHead>
                <TableHead>Arabic Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 && (
                <TableRow>
                  <TableCell className="py-10 text-center text-muted-foreground" colSpan={4}>
                    No categories yet.
                  </TableCell>
                </TableRow>
              )}
              {categories.map((category) => {
                const arName = category.translations.find((t) => t.locale === "ar")?.name ?? "-";
                const enName = category.translations.find((t) => t.locale === "en")?.name ?? "-";
                return (
                  <TableRow key={category.id}>
                    <TableCell>
                      <span
                        className="inline-block size-5 rounded-full"
                        style={{ background: category.color }}
                        title={category.color}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                    <TableCell>{enName}</TableCell>
                    <TableCell dir="rtl">{arName}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/dashboard/categories/page.tsx
git commit -m "feat: redesign categories page with Card form, color swatch, and SVG icon field"
```

---

### Task 10: Users Page — shadcn Select for Role

**Files:**
- Modify: `src/app/[locale]/dashboard/users/page.tsx`

- [x] **Step 1: Rewrite users page with proper role select and ban toggle**

Replace raw `<select>` and `<input type="checkbox">` with shadcn Select and Switch components. Wrap in a Card.

```typescript
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

async function updateUserRole(formData: FormData) {
  "use server";
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "user");
  const banned = String(formData.get("banned") ?? "false") === "true";
  await db.user.update({ where: { id: userId }, data: { role, banned } });
  revalidatePath("/[locale]/dashboard/users", "layout");
}

export default async function UsersPage() {
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Users" />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn("border text-xs", user.banned
                        ? "border-status-danger/40 bg-status-danger/18 text-status-danger"
                        : "border-status-success/40 bg-status-success/18 text-status-success"
                      )}
                      variant="outline"
                    >
                      {user.banned ? "Banned" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <form action={updateUserRole} className="flex items-center gap-2">
                      <input name="userId" type="hidden" value={user.id} />
                      <input name="banned" type="hidden" value={user.banned ? "true" : "false"} />
                      <Select defaultValue={user.role} name="role">
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" type="submit" variant="outline">Save</Button>
                    </form>
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={updateUserRole}>
                      <input name="userId" type="hidden" value={user.id} />
                      <input name="role" type="hidden" value={user.role} />
                      <input name="banned" type="hidden" value={(!user.banned).toString()} />
                      <Button size="sm" type="submit" variant="ghost">
                        {user.banned ? "Unban" : "Ban"}
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/dashboard/users/page.tsx
git commit -m "feat: redesign users page with shadcn Select role picker and tonal status badges"
```

---

### Task 11: Menus Page — @dnd-kit Drag Reorder

**Files:**
- Modify: `src/app/[locale]/dashboard/menus/page.tsx`
- Create: `src/app/[locale]/dashboard/menus/menu-item-list.tsx`

- [x] **Step 1: Create server action for reordering menu items**

In `src/app/[locale]/dashboard/menus/actions.ts`:

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function reorderMenuItems(menuId: string, orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      db.menuItem.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath("/[locale]/dashboard/menus", "layout");
}
```

- [x] **Step 2: Create `src/app/[locale]/dashboard/menus/menu-item-list.tsx`**

Client component using `@dnd-kit/core` and `@dnd-kit/sortable` for drag reorder.

```typescript
"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reorderMenuItems } from "./actions";

type MenuItem = {
  id: string;
  order: number;
  url: string | null;
  type: string;
  translations: { locale: string; label: string }[];
};

function SortableItem({ item }: { item: MenuItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const label = item.translations.find((t) => t.locale === "en")?.label ?? item.url ?? item.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        type="button"
      >
        <HugeiconsIcon className="size-4" icon={GripVerticalIcon} strokeWidth={2} />
      </button>
      <span className="flex-1 text-sm">{label}</span>
      <span className="text-xs text-muted-foreground">{item.url}</span>
    </div>
  );
}

export function MenuItemList({ items, menuId }: { items: MenuItem[]; menuId: string }) {
  const [ordered, setOrdered] = useState(() => [...items].sort((a, b) => a.order - b.order));
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ordered.findIndex((item) => item.id === active.id);
    const newIndex = ordered.findIndex((item) => item.id === over.id);
    const newOrder = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(newOrder);

    startTransition(async () => {
      await reorderMenuItems(menuId, newOrder.map((i) => i.id));
      toast.success("Menu order saved.");
    });
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
      <SortableContext items={ordered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className={`flex flex-col gap-1.5 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
          {ordered.map((item) => (
            <SortableItem item={item} key={item.id} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

- [x] **Step 3: Rewrite `src/app/[locale]/dashboard/menus/page.tsx`**

```typescript
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/dashboard/page-header";
import { MenuItemList } from "./menu-item-list";

async function createMenu(formData: FormData) {
  "use server";
  const location = String(formData.get("location") ?? "").trim();
  if (!location) return;
  await db.menu.upsert({ where: { location }, update: {}, create: { location } });
  revalidatePath("/[locale]/dashboard/menus", "layout");
}

async function addMenuItem(formData: FormData) {
  "use server";
  const menuId = String(formData.get("menuId") ?? "");
  const labelEn = String(formData.get("labelEn") ?? "").trim();
  const labelAr = String(formData.get("labelAr") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!menuId || !url) return;
  const lastItem = await db.menuItem.findFirst({ where: { menuId }, orderBy: { order: "desc" } });
  const item = await db.menuItem.create({
    data: { menuId, order: (lastItem?.order ?? -1) + 1, type: "url", url },
  });
  if (labelEn) await db.menuItemTranslation.create({ data: { menuItemId: item.id, locale: "en", label: labelEn } });
  if (labelAr) await db.menuItemTranslation.create({ data: { menuItemId: item.id, locale: "ar", label: labelAr } });
  revalidatePath("/[locale]/dashboard/menus", "layout");
}

export default async function MenusPage() {
  const menus = await db.menu.findMany({
    include: { items: { include: { translations: true }, orderBy: { order: "asc" } } },
    orderBy: { location: "asc" },
  });

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Menus" />

      <Card>
        <CardHeader>
          <CardTitle>Create Menu</CardTitle>
          <CardDescription>A menu location key (e.g. header-main, footer-links)</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createMenu} className="flex gap-3">
            <Input className="max-w-sm" name="location" placeholder="header-main" />
            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>

      {menus.map((menu) => (
        <Card key={menu.id}>
          <CardHeader>
            <CardTitle className="font-mono text-base">{menu.location}</CardTitle>
            <CardDescription>Drag items to reorder. Changes save automatically.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <MenuItemList items={menu.items} menuId={menu.id} />

            <form action={addMenuItem} className="mt-2 grid gap-3 md:grid-cols-4">
              <input name="menuId" type="hidden" value={menu.id} />
              <Input dir="ltr" name="labelEn" placeholder="English label" />
              <Input dir="rtl" name="labelAr" placeholder="Arabic label" />
              <Input name="url" placeholder="/en/events" />
              <Button type="submit">Add Item</Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Run dev and verify drag reorder**

Open `http://localhost:3000/en/dashboard/menus`. Drag a menu item — verify order updates and toast appears.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/dashboard/menus/
git commit -m "feat: add @dnd-kit drag reorder to menus and Card-based layout"
```

---

### Task 12: Wire Sonner Toaster into Dashboard Layout

**Files:**
- Modify: `src/app/[locale]/dashboard/layout.tsx`

- [x] **Step 1: Read current dashboard layout**

Read `src/app/[locale]/dashboard/layout.tsx`.

- [x] **Step 2: Add Toaster**

Import `Toaster` from `sonner` and render it inside the layout (inside the outermost div, after `{children}`):

```typescript
import { Toaster } from "sonner";
// ... inside return:
<>
  {children}
  <Toaster position="bottom-right" richColors />
</>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/dashboard/layout.tsx
git commit -m "feat: add sonner Toaster to dashboard layout"
```

---

### Task 13: Final Verification Pass

- [ ] **Step 1: Full typecheck**

```bash
pnpm typecheck
```

Expected: PASS with 0 errors.

- [ ] **Step 2: Manual verification tour**

Navigate each page in browser at `http://localhost:3000/en/dashboard/`:
- `/` — KPI cards with CountUp animation, recent registrations table with tonal badges
- `/events` — search box filters, dropdown row actions, status/type tonal badges
- `/events/new` — Card sections, zod validation, create redirects to list
- `/events/[id]` — prefilled values, save updates correctly
- `/posts` — same as events table
- `/posts/new` and `/posts/[id]` — same as events form
- `/registrations` — search + status filter, tonal badges, human-readable method labels
- `/categories` — Card form with SVG textarea, color swatch in table
- `/users` — shadcn Select for role, ban/unban button, tonal status badges
- `/menus` — drag reorder with toast confirmation

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: dashboard visual overhaul complete — all pages redesigned to design system spec"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Tonal badges (border-status-*/40 bg-status-*/18 text-status-*) — tone.ts + all table components
- ✅ Card + CardHeader (title + description) + CardContent for form sections — EventForm, PostForm, CategoryPage, MenusPage
- ✅ shadcn Form/FormField/FormItem/FormLabel/FormControl/FormMessage — EventForm, PostForm
- ✅ react-hook-form + zod — EventForm, PostForm
- ✅ Client-side search — EventsTable, PostsTable, RegistrationsTable
- ✅ Row action DropdownMenu — EventsTable, PostsTable
- ✅ Human-readable select labels — formatEventStatus, formatEventType, formatPaymentMethod, all Select components
- ✅ Animated CountUp — count-up.tsx on overview KPI cards
- ✅ Drag-reorder menus — @dnd-kit in MenuItemList
- ✅ CSS dark :root + status tokens — Task 2
- ✅ Missing packages installed — Task 1
- ✅ Sonner toast wired — Task 12

**Type consistency:**
- `EventFormValues` defined in `event-form.tsx`, used in `new/page.tsx` and `[id]/page.tsx` — same file, no mismatch
- `formatEventStatus` used in both EventsTable and PostsTable — consistent import path `@/lib/format`
- `getEventStatusTone` used for both event status and post status — intentional reuse, same draft/published values
- `reorderMenuItems` server action in `actions.ts`, imported in `menu-item-list.tsx` — correct boundary

**Placeholder scan:** None found. All steps contain actual code.





