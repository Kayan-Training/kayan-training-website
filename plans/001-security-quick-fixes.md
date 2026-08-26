# Plan 001: Close four unauthenticated/unsafe security gaps

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9305d34..HEAD -- src/lib/auth.ts src/app/api/media/upload/presign/route.ts "src/app/api/admin/registrations/[id]/route.ts" "src/app/api/admin/exports/registrations/route.ts"`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts below against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `9305d34`, 2026-07-17

## Why this matters

Four independent, low-effort gaps currently expose the app to real damage: (1)
if `BETTER_AUTH_SECRET` is ever unset in a deployed environment, sessions are
signed with a secret that is literally committed to the repo, letting anyone
forge admin sessions; (2) the media presign endpoint hands out valid S3 upload
URLs to anyone, authenticated or not; (3) an admin API route dumps every
registration's PII and payment data to any caller with the URL, no login
required; (4) the CSV export routes don't neutralize leading `=`/`+`/`-`/`@`
characters, so a registrant can plant a formula that executes when an admin
opens the export in Excel/Sheets. Each fix is small, isolated, and low-risk —
bundled here because none of them depend on each other and all four close a
concrete, exploitable gap.

## Current state

- `src/lib/auth.ts` — Better Auth server config. Line 25:
  ```ts
  const authSecret = process.env.BETTER_AUTH_SECRET ?? "dev-only-better-auth-secret-change-me";
  ```
  Falls back to a hardcoded secret silently instead of failing in production.

- `src/app/api/media/upload/presign/route.ts` — issues S3 presigned upload
  URLs. Full current file:
  ```ts
  import { NextResponse } from "next/server";
  import { z } from "zod";

  import {
    S3_ALLOWED_MIME_TYPES,
    S3_MAX_UPLOAD_BYTES,
    createPresignedUpload,
  } from "@/lib/storage/s3";

  const bodySchema = z.object({
    filename: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.number().int().positive(),
  });

  export async function POST(request: Request) {
    const parsed = bodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { filename, mimeType, size } = parsed.data;

    if (!S3_ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    if (size > S3_MAX_UPLOAD_BYTES) {
      const maxMb = Math.floor(S3_MAX_UPLOAD_BYTES / (1024 * 1024));
      return NextResponse.json(
        { error: `File exceeds ${maxMb}MB limit.` },
        { status: 400 },
      );
    }

    try {
      const result = await createPresignedUpload({ filename, mimeType });
      return NextResponse.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create upload URL.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
  ```
  No session check anywhere. Contrast with
  `src/app/api/media/upload/complete/route.ts:22-26`, which correctly calls
  `getServerSession()` before writing the DB record — that sibling route is
  your pattern to match (read it before starting step 2).

- `src/app/api/admin/registrations/[id]/route.ts` — full current file:
  ```ts
  /**
   * Registration export route (CSV).
   */
  import { NextResponse } from "next/server";

  import { db } from "@/lib/db";

  function toCsv(rows: Array<Record<string, string>>) {
    if (!rows.length) {
      return "id,eventId,userId,eventKind,eventPath,status,paymentStatus,paymentMethod,amount,cancelledAt,createdAt";
    }

    const headers = Object.keys(rows[0]);
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

    const lines = [headers.join(",")];

    for (const row of rows) {
      lines.push(headers.map((header) => escape(row[header] ?? "")).join(","));
    }

    return lines.join("\n");
  }

  export async function GET(request: Request) {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
    }

    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");

    const registrations = await db.registration.findMany({
      where: eventId ? { eventId } : undefined,
      include: { event: { select: { slug: true, eventKind: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const csv = toCsv(
      registrations.map((row) => ({
        id: row.id,
        eventId: row.eventId,
        userId: row.userId ?? "",
        eventKind: (row.event.eventKind ?? "event") as string,
        eventPath: row.event.eventKind === "training_course" ? `/training-courses/${row.event.slug}` : `/events/${row.event.slug}`,
        status: row.status,
        paymentStatus: row.paymentStatus,
        paymentMethod: row.paymentMethod,
        amount: row.amount.toString(),
        cancelledAt: row.cancelledAt?.toISOString() ?? "",
        createdAt: row.createdAt.toISOString(),
      })),
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="registrations${eventId ? `-${eventId}` : ""}.csv"`,
      },
    });
  }
  ```
  No session check. `grep -rn "admin/registrations/\[id\]\|/api/admin/registrations/" src` finds no in-repo caller — this route is live but unused by the app itself.

- `src/app/api/admin/exports/registrations/route.ts` — the sibling export
  route. It **already** does auth correctly:
  ```ts
  import { requireAdminSession } from "@/lib/session";
  // ...
  export async function GET(request: Request) {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ...
  ```
  This is your pattern for step 3. Its `toCsv`/`escape` helper (lines 9-24) has
  the same formula-injection gap as the `[id]/route.ts` file above — fix both
  in step 4.

- `src/lib/session.ts` — existing helpers you will reuse, already correct,
  do not modify:
  ```ts
  export async function getServerSession() {
    return auth.api.getSession({ headers: await headers() });
  }

  export async function requireAdminSession() {
    const session = await getServerSession();
    if (!session || session.user.role !== "admin") {
      return null;
    }
    return session;
  }
  ```

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|-------------------|---------------------|
| Typecheck | `pnpm typecheck`  | exit 0, no errors   |
| Lint      | `pnpm lint`       | exit 0              |

(No test suite exists — `pnpm test` is a no-op echo. Do not add one as part of this plan.)

## Scope

**In scope** (the only files you should modify):
- `src/lib/auth.ts`
- `src/app/api/media/upload/presign/route.ts`
- `src/app/api/admin/registrations/[id]/route.ts`
- `src/app/api/admin/exports/registrations/route.ts`

**Out of scope** (do NOT touch, even though they look related):
- `src/app/api/media/upload/complete/route.ts` — already correct, read-only reference.
- `src/lib/session.ts` — already correct, read-only reference.
- Dashboard server actions (`_actions.ts` files) — covered by a separate plan (002). Do not add auth checks there in this plan.
- The registration capacity/transaction logic in `src/lib/registrations/service.ts` — covered by plan 003.

## Git workflow

- Branch: `advisor/001-security-quick-fixes`
- Commit per step (4 commits), conventional-commit style matching this repo's
  history (e.g. `feat: ...`, but since these are fixes use `fix: ...` — repo
  has no prior `fix:` commits to match exactly, conventional-commit format is
  still expected).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fail fast on a missing `BETTER_AUTH_SECRET` instead of silently falling back

In `src/lib/auth.ts`, replace the fallback-secret line with a throw when the
env var is missing. Match this shape:

```ts
const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required.");
}
```

Then use `authSecret` exactly as before wherever it's referenced further down
in the file (do not rename the variable — check how it's consumed below line
25 before editing so the rest of the config still compiles).

**Verify**: `pnpm typecheck` → exit 0, no errors.

### Step 2: Require a session before issuing S3 presigned upload URLs

In `src/app/api/media/upload/presign/route.ts`, add the same session check
used in the sibling `complete/route.ts`. Import `getServerSession` from
`@/lib/session` and add this at the top of the `POST` handler, before body
parsing:

```ts
const session = await getServerSession();
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

Read `src/app/api/media/upload/complete/route.ts:1-30` first to confirm the
exact import path and pattern it uses, and match it (don't invent a different
auth check).

**Verify**: `pnpm typecheck` → exit 0, no errors.

### Step 3: Require admin session on the unauthenticated registrations export route

In `src/app/api/admin/registrations/[id]/route.ts`, add the same guard used in
`src/app/api/admin/exports/registrations/route.ts`:

```ts
import { requireAdminSession } from "@/lib/session";
// ...
export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...existing body follows unchanged
```

**Verify**: `pnpm typecheck` → exit 0, no errors.

### Step 4: Neutralize CSV formula injection in both export routes

In both `src/app/api/admin/registrations/[id]/route.ts` and
`src/app/api/admin/exports/registrations/route.ts`, update the `escape`
function inside `toCsv` to prefix values that start with `=`, `+`, `-`, or `@`
with a leading `'` before quoting, so spreadsheet apps treat them as text, not
formulas:

```ts
const escape = (value: string) => {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};
```

Apply this identical change in both files (the two `toCsv` functions are
independent copies — do not extract a shared helper as part of this plan,
that's out of scope).

**Verify**: `pnpm typecheck` → exit 0, no errors.
`grep -n "escape = (value: string)" src/app/api/admin/registrations/\[id\]/route.ts src/app/api/admin/exports/registrations/route.ts` → both matches show the `/^[=+\-@]/` guard.

## Test plan

No test suite exists in this repo (`pnpm test` is a no-op). Do not add one —
out of scope for this plan. Manual verification instead:

- After step 2, confirm (by reading the code, not running it) that an
  unauthenticated `POST` to `/api/media/upload/presign` now returns 401 before
  reaching `createPresignedUpload`.
- After step 3, confirm an unauthenticated `GET` to
  `/api/admin/registrations/[id]` now returns 401 before the `db.registration.findMany` call.
- After step 4, confirm a value like `=1+1` in any exported field would be
  escaped to `'=1+1` in the CSV output (trace the code path, don't need to run
  it).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `grep -n "dev-only-better-auth-secret-change-me" src/lib/auth.ts` returns no matches
- [ ] `grep -n "getServerSession" src/app/api/media/upload/presign/route.ts` returns a match
- [ ] `grep -n "requireAdminSession" "src/app/api/admin/registrations/[id]/route.ts"` returns a match
- [ ] `grep -rn "\[=+\\\\-@\]" src/app/api/admin/` returns 2 matches (one per file)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any of the four files' current content doesn't match the excerpts in
  "Current state" (drift since this plan was written).
- `src/app/api/media/upload/complete/route.ts` no longer imports
  `getServerSession` the way described — the pattern to copy has changed and
  you need updated guidance.
- Making `BETTER_AUTH_SECRET` required breaks local dev because no `.env` sets
  it — do not add a new fallback; report back with the missing-env-var error
  instead.
- The fix appears to require touching a file outside the in-scope list.

## Maintenance notes

- Plan 002 will add auth checks to dashboard server actions — same
  `requireAdminSession`/`getServerSession` helpers from `src/lib/session.ts`,
  no new pattern needed there either.
- If a shared CSV-export utility module is ever introduced, the two
  independent `toCsv`/`escape` copies touched in step 4 should be merged into
  it — flagged here as a known duplication, not fixed in this plan.
- A reviewer should specifically check that `BETTER_AUTH_SECRET` is actually
  set in every deployed environment (staging, prod) before this lands, since
  step 1 will make the app fail to start otherwise.
