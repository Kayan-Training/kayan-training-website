# Plan 002: Add server-side admin auth checks to every dashboard server action

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9305d34..HEAD -- "src/app/[locale]/dashboard/categories/_actions.ts" "src/app/[locale]/dashboard/events/_actions.ts" "src/app/[locale]/dashboard/media/_actions.ts" "src/app/[locale]/dashboard/menus/_actions.ts" "src/app/[locale]/dashboard/pages/_actions.ts" "src/app/[locale]/dashboard/posts/_actions.ts" "src/app/[locale]/dashboard/registrations/_actions.ts" "src/app/[locale]/dashboard/settings/_actions.ts" "src/app/[locale]/dashboard/trainers/_actions.ts" "src/app/[locale]/dashboard/users/_actions.ts"`
> If any in-scope file changed since this plan was written, compare the
> function lists below against the live file before proceeding; on a
> mismatch (a function renamed, added, or removed), treat it as a STOP
> condition and report which file/function differs.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (independent of plans/001, plans/003 — different files)
- **Category**: security
- **Planned at**: commit `9305d34`, 2026-07-17

## Why this matters

Every dashboard feature (users, registrations, events, pages, posts, media,
categories, menus, trainers, settings) is implemented as Next.js Server
Actions in 10 `_actions.ts` files. None of these 44 exported functions check
who is calling them — the *only* protection today is
`src/app/[locale]/dashboard/layout.tsx`, which redirects non-admins away from
rendering the dashboard *pages*. Server Actions are independently callable
POST endpoints (Next.js exposes each one's action id in the client bundle);
they do not automatically inherit a parent layout's render-time redirect.
Today, `setUserRole` can set any user's role to `"admin"`, `verifyPayment` can
mark any payment as verified, and `deleteRegistrations`/`deleteTrainer`/etc.
can destroy data — all with no server-side check that the caller is even
logged in, let alone an admin. This plan adds a single, consistent guard to
every one of these 44 functions using the project's own existing
`requireAdminSession()` helper (already used correctly in
`src/app/api/admin/exports/registrations/route.ts` and, after plan 001 lands,
in the presign/export routes too) — no new auth mechanism is introduced.

## Current state

- `src/lib/session.ts` — the helper you will import into every file, already
  correct, **do not modify**:
  ```ts
  export async function requireAdminSession() {
    const session = await getServerSession();
    if (!session || session.user.role !== "admin") {
      return null;
    }
    return session;
  }
  ```

- `src/app/[locale]/dashboard/layout.tsx:26-34` — confirms every dashboard
  route already requires `session.user.role === "admin"` to even render:
  ```ts
  const session = await getServerSession();
  if (!session) {
    redirect(`/${activeLocale}/auth`);
  }
  if (session.user.role !== "admin") {
    redirect(`/${activeLocale}/events`);
  }
  ```
  This confirms `requireAdminSession()` (session + role check) is the correct
  bar to match in every action — not merely "is logged in."

- Example of the current (unguarded) shape, from
  `src/app/[locale]/dashboard/users/_actions.ts:1-15`:
  ```ts
  "use server";

  import { revalidatePath } from "next/cache";

  import { db } from "@/lib/db";

  export async function setUserRole(id: string, role: string, locale: string): Promise<{ error?: string }> {
    try {
      await db.user.update({ where: { id }, data: { role } });
      revalidatePath(`/${locale}/dashboard/users`);
      return {};
    } catch {
      return { error: "Failed to update role" };
    }
  }
  ```

## The guard pattern (apply mechanically to every function below)

Every in-scope function falls into exactly one of three categories based on
its return type. Add the import once per file:

```ts
import { requireAdminSession } from "@/lib/session";
```

Then, as the **first line inside the function body** (before any other
logic, including any existing `try`), add:

**Category A — return type includes `{ error?: string; ... }`** (an object
with an optional `error` field, whether or not it has other optional fields
like `item?:` or `block?:`):
```ts
const session = await requireAdminSession();
if (!session) {
  return { error: "Unauthorized" };
}
```

**Category B — return type is `Promise<void>`** (only `createPageAction`):
```ts
const session = await requireAdminSession();
if (!session) {
  return;
}
```

**Category C — return type is pure data with no `error` field** (arrays or
plain objects like `{ items, page, totalPages, total }`, used by the
`fetch*MediaAction`/`fetch*MediaPageAction` helpers):
```ts
const session = await requireAdminSession();
if (!session) {
  throw new Error("Unauthorized");
}
```

Do not change any other logic in these functions — no refactoring, no
renaming, no touching the `try`/`catch` bodies beyond inserting the guard
above them.

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|-------------------|---------------------|
| Typecheck | `pnpm typecheck`  | exit 0, no errors   |
| Lint      | `pnpm lint`       | exit 0              |

(No test suite exists — `pnpm test` is a no-op echo. Do not add one as part of this plan.)

## Scope

**In scope** (the only files you should modify — exactly these 10):
- `src/app/[locale]/dashboard/categories/_actions.ts`
- `src/app/[locale]/dashboard/events/_actions.ts`
- `src/app/[locale]/dashboard/media/_actions.ts`
- `src/app/[locale]/dashboard/menus/_actions.ts`
- `src/app/[locale]/dashboard/pages/_actions.ts`
- `src/app/[locale]/dashboard/posts/_actions.ts`
- `src/app/[locale]/dashboard/registrations/_actions.ts`
- `src/app/[locale]/dashboard/settings/_actions.ts`
- `src/app/[locale]/dashboard/trainers/_actions.ts`
- `src/app/[locale]/dashboard/users/_actions.ts`

**Out of scope** (do NOT touch, even though they look related):
- Any `_components/*.tsx` file that calls these actions from the client —
  they need no changes; the guard is server-side only and transparent to
  callers that are already admins.
- `src/app/[locale]/dashboard/layout.tsx` — already correct, read-only
  reference.
- `src/lib/session.ts` — already correct, read-only reference.
- The API routes covered by plan 001, and the transaction logic covered by
  plan 003.

## Git workflow

- Branch: `advisor/002-dashboard-action-auth`
- Commit per file (10 commits) or one commit per logical group if you prefer
  — either is fine since all changes follow one mechanical pattern. Use
  conventional-commit style (e.g. `fix: require admin session in registrations actions`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: `categories/_actions.ts` — 5 functions, all Category A

Functions to guard: `fetchCategoryMediaAction` (Category C — pure array,
no `error` field), `createCategory`, `updateCategory`, `deleteCategory`,
`saveCategoryOrder` (all Category A).

**Verify**: `pnpm typecheck` → exit 0.
`grep -c "requireAdminSession()" "src/app/[locale]/dashboard/categories/_actions.ts"` → `5`

### Step 2: `events/_actions.ts` — 7 functions

- `fetchMediaAction`, `fetchGalleryMediaAction`, `fetchMediaPageAction`,
  `fetchGalleryMediaPageAction` — Category C (pure data, no `error` field).
- `updateEventAction`, `createEventAction`, `deleteProgramsAction` —
  Category A.

**Verify**: `pnpm typecheck` → exit 0.
`grep -c "requireAdminSession()" "src/app/[locale]/dashboard/events/_actions.ts"` → `7`

### Step 3: `media/_actions.ts` — 2 functions, both Category A

`deleteMedia`, `upsertMediaTranslations`.

**Verify**: `pnpm typecheck` → exit 0.
`grep -c "requireAdminSession()" "src/app/[locale]/dashboard/media/_actions.ts"` → `2`

### Step 4: `menus/_actions.ts` — 5 functions, all Category A

`createMenuItem`, `updateMenuItem`, `deleteMenuItem`, `reorderMenuItems`,
`updateHeaderCta`.

**Verify**: `pnpm typecheck` → exit 0.
`grep -c "requireAdminSession()" "src/app/[locale]/dashboard/menus/_actions.ts"` → `5`

### Step 5: `pages/_actions.ts` — 6 functions

- `fetchMediaAction`, `fetchMediaPageAction` — Category C (pure data).
- `updatePageAction`, `translateBlockAction`, `deletePageAction` — Category A.
- `createPageAction` — Category B (`Promise<void>`, guard uses bare `return;`).

Note: this file also has a non-exported helper ending near line 185 with
`Promise<string[]>` — that is an internal function, not exported, and is
**not** in scope; do not add a guard to it.

**Verify**: `pnpm typecheck` → exit 0.
`grep -c "requireAdminSession()" "src/app/[locale]/dashboard/pages/_actions.ts"` → `6`

### Step 6: `posts/_actions.ts` — 4 functions

- `fetchMediaAction` — Category C.
- `updatePostAction`, `createPostAction`, `deletePostsAction` — Category A.

**Verify**: `pnpm typecheck` → exit 0.
`grep -c "requireAdminSession()" "src/app/[locale]/dashboard/posts/_actions.ts"` → `4`

### Step 7: `registrations/_actions.ts` — 7 functions, all Category A

`verifyPayment`, `rejectPayment`, `bulkUpdateRegistrationStatus`,
`deleteRegistrations`, `cancelRegistration`, `updateRegistrationAdmin`,
`createRegistrationAdmin`. This is the highest-value file in this plan (it
guards payment verification and bulk delete) — double-check each of the 7
got the guard before moving on.

**Verify**: `pnpm typecheck` → exit 0.
`grep -c "requireAdminSession()" "src/app/[locale]/dashboard/registrations/_actions.ts"` → `7`

### Step 8: `settings/_actions.ts` — 2 functions

- `upsertSettings` — Category A.
- `fetchSettingsMediaAction` — check its return type at the top of the
  function signature (spans lines 27+); if it has no `error` field, treat as
  Category C, otherwise Category A.

**Verify**: `pnpm typecheck` → exit 0.
`grep -c "requireAdminSession()" "src/app/[locale]/dashboard/settings/_actions.ts"` → `2`

### Step 9: `trainers/_actions.ts` — 5 functions

- `fetchTrainerMediaAction` — Category C.
- `createTrainer`, `updateTrainer`, `deleteTrainer`, `saveTrainerOrder` —
  Category A.

**Verify**: `pnpm typecheck` → exit 0.
`grep -c "requireAdminSession()" "src/app/[locale]/dashboard/trainers/_actions.ts"` → `5`

### Step 10: `users/_actions.ts` — 2 functions, both Category A

`setUserRole`, `toggleBanUser`. This is the second-highest-value file (it
guards role escalation) — verify the guard runs before the `db.user.update`
call in both functions, not after.

**Verify**: `pnpm typecheck` → exit 0.
`grep -c "requireAdminSession()" "src/app/[locale]/dashboard/users/_actions.ts"` → `2`

## Test plan

No test suite exists in this repo (`pnpm test` is a no-op). Do not add one —
out of scope for this plan. Manual verification instead: after all 10 steps,
confirm by reading each file that the guard is the first statement inside
every exported function body, and that no guard was accidentally placed
inside a `try` block after another `await` (which would let that earlier
`await` run before the check).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm lint` exits 0
- [ ] Total guard count across all 10 files equals 44:
      `grep -rc "requireAdminSession()" "src/app/[locale]/dashboard/categories/_actions.ts" "src/app/[locale]/dashboard/events/_actions.ts" "src/app/[locale]/dashboard/media/_actions.ts" "src/app/[locale]/dashboard/menus/_actions.ts" "src/app/[locale]/dashboard/pages/_actions.ts" "src/app/[locale]/dashboard/posts/_actions.ts" "src/app/[locale]/dashboard/registrations/_actions.ts" "src/app/[locale]/dashboard/settings/_actions.ts" "src/app/[locale]/dashboard/trainers/_actions.ts" "src/app/[locale]/dashboard/users/_actions.ts" | awk -F: '{sum+=$2} END {print sum}'`
      → `44` (adjust only if step 8's `fetchSettingsMediaAction` category
      changes the per-file count you verified in step 8 — the total across
      all 10 files must still equal the sum of the counts you verified per
      step)
- [ ] Every file imports `requireAdminSession` from `@/lib/session`:
      `grep -rl "from \"@/lib/session\"" "src/app/[locale]/dashboard/"*/_actions.ts | wc -l` → `10`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any file's function list doesn't match what's listed in this plan's Steps
  section (a function was added/removed/renamed since this plan was written).
- `requireAdminSession` in `src/lib/session.ts` no longer has the signature
  shown in "Current state" (returns something other than `session | null`).
- A function's return type doesn't clearly fall into Category A, B, or C —
  report the function name and its exact return type rather than guessing.
- `pnpm typecheck` fails after any step and the error isn't obviously a typo
  in the guard snippet you just added.

## Maintenance notes

- Any new `_actions.ts` file added in the future must include this same
  guard as its first line in every exported function — this is now the
  repo's de facto convention; a reviewer should treat a new unguarded action
  as a regression of this plan.
- This plan does not add rate limiting or audit logging to these actions —
  `BUG-03` from the audit (silent error swallowing with no logging in catch
  blocks) is a related but separate gap, not fixed here.
- If the project later adds a non-admin authenticated role (e.g. "editor")
  that should access a subset of these actions, `requireAdminSession()` will
  need to be replaced with a more granular check on a per-function basis —
  flag this file list as the place to make that change.
