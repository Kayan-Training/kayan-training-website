# Plan 003: Make event registration capacity check and writes atomic

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9305d34..HEAD -- src/lib/registrations/service.ts`
> If this file changed since this plan was written, compare the "Current
> state" excerpt below against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `9305d34`, 2026-07-17

## Why this matters

`createRegistration` in `src/lib/registrations/service.ts` reads the event's
current registration count, compares it to capacity, and only *afterward*
creates the `Registration` and `Payment` rows as two separate, non-atomic
`db.create` calls. Under concurrent submissions near an event's capacity
limit — a realistic scenario for a popular, limited-seat training course —
multiple requests can each pass the capacity check before any of them
commits, letting the event overbook past its stated capacity. Separately, if
the process crashes or a connection drops between the `Registration` create
and the `Payment` create, a registration can exist with no matching payment
row, which the admin exports (`src/app/api/admin/exports/registrations/route.ts`)
assume always exists when computing payment/verification fields. This plan
wraps the capacity check, duplicate-email check, and both creates in a single
serializable database transaction so either the whole registration succeeds
consistently or none of it does, and a concurrent overbooking attempt fails
outright rather than silently succeeding.

## Current state

Full current function, `src/lib/registrations/service.ts:8-134`:

```ts
export async function hasExistingRegistrationForEmail(eventId: string, email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  const result = await db.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM "Registration" r
      LEFT JOIN "User" u ON u.id = r."userId"
      WHERE r."eventId" = ${eventId}
        AND r."cancelledAt" IS NULL
        AND (
          LOWER(COALESCE(u.email, '')) = ${normalizedEmail}
          OR LOWER(COALESCE(r."formData"->>'email', '')) = ${normalizedEmail}
        )
    ) AS "exists"
  `;

  return Boolean(result[0]?.exists);
}

export async function createRegistration(input: {
  amount: string;
  eventId: string;
  extraFormData?: Record<string, string>;
  locale: "ar" | "en";
  paymentMethod: "bank" | "card" | "free";
  registrantEmail: string;
  registrantName: string;
  userId?: string;
}) {
  const amountNumber = Number(input.amount || "0");
  const amount = Number.isFinite(amountNumber) ? amountNumber : 0;
  const event = await db.event.findUnique({
    include: {
      registrations: { select: { id: true } },
      translations: {
        take: 1,
        where: { locale: input.locale },
      },
    },
    where: { id: input.eventId },
  });

  if (!event) {
    throw new Error("Event not found.");
  }
  if (!event.registrationsOpen) {
    throw new Error("Registrations are closed.");
  }
  if (event.registrationDeadline && event.registrationDeadline < new Date()) {
    throw new Error("Registration deadline passed.");
  }
  if (event.capacity && event.registrations.length >= event.capacity) {
    await db.event.update({
      data: { registrationsOpen: false },
      where: { id: event.id },
    });
    throw new Error("Event capacity reached.");
  }
  if (await hasExistingRegistrationForEmail(input.eventId, input.registrantEmail)) {
    throw new Error("A registration already exists for this email.");
  }

  const registration = await db.registration.create({
    data: {
      amount,
      eventId: input.eventId,
      formData: {
        email: input.registrantEmail,
        emailNormalized: input.registrantEmail.trim().toLowerCase(),
        locale: input.locale,
        name: input.registrantName,
        ...(input.extraFormData ?? {}),
      },
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "free" ? "paid" : "pending",
      status: input.paymentMethod === "free" ? "confirmed" : "submitted",
      userId: input.userId ?? null,
    },
  });

  await db.payment.create({
    data: {
      method: input.paymentMethod,
      registrationId: registration.id,
      status: input.paymentMethod === "free" ? "paid" : "pending",
    },
  });

  if (event.capacity) {
    const total = await db.registration.count({
      where: { eventId: event.id },
    });
    if (total >= event.capacity && event.registrationsOpen) {
      await db.event.update({
        data: { registrationsOpen: false },
        where: { id: event.id },
      });
    }
  }

  const eventTitle = event?.translations[0]?.title ?? event?.slug ?? "Event";
  const mail = registrationConfirmationTemplate({
    eventTitle,
    locale: input.locale,
    registrantName: input.registrantName,
  });

  await sendEmail({ html: mail.html, subject: mail.subject, text: mail.text, to: input.registrantEmail });

  if (input.paymentMethod === "bank") {
    const pending = bankTransferPendingTemplate({
      eventTitle,
      locale: input.locale,
      registrantName: input.registrantName,
    });
    await sendEmail({
      html: pending.html,
      subject: pending.subject,
      text: pending.text,
      to: input.registrantEmail,
    });
  }

  return registration;
}
```

Two callers, unchanged by this plan, both currently call `createRegistration`
with **no try/catch** — any thrown error (including the existing
`"Event capacity reached."` etc.) already propagates uncaught to the Next.js
error boundary today. This plan does not change that behavior; a new
serialization-conflict error will surface the same way existing capacity
errors already do:
- `src/app/[locale]/events/[slug]/register/page.tsx:49`
- `src/app/[locale]/training-courses/[slug]/register/page.tsx:49`

`db` is Prisma's client, imported as `import { db } from "@/lib/db";` at the
top of `src/lib/registrations/service.ts` — do not change this import.

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|-------------------|---------------------|
| Typecheck | `pnpm typecheck`  | exit 0, no errors   |
| Lint      | `pnpm lint`       | exit 0              |

(No test suite exists — `pnpm test` is a no-op echo.)

## Scope

**In scope** (the only file you should modify):
- `src/lib/registrations/service.ts`

**Out of scope** (do NOT touch, even though they look related):
- `src/app/[locale]/events/[slug]/register/page.tsx` and
  `src/app/[locale]/training-courses/[slug]/register/page.tsx` — their
  lack of try/catch around `createRegistration` is a pre-existing condition,
  not introduced or worsened by this plan; adding error handling there is a
  separate concern, out of scope here.
- `src/app/api/admin/exports/registrations/route.ts` and other readers of
  `Registration`/`Payment` — they already assume both rows exist together;
  this plan makes that assumption actually hold, no changes needed there.
- The email-sending calls (`sendEmail`, `registrationConfirmationTemplate`,
  `bankTransferPendingTemplate`) — keep these **outside** the transaction
  (see Step 2): they are external I/O and must not run inside a DB
  transaction, and a slow email provider must not hold a DB transaction open.

## Git workflow

- Branch: `advisor/003-registration-transaction-safety`
- Single commit is fine given this is one cohesive change to one function.
  Conventional-commit style, e.g. `fix: make registration capacity check and writes atomic`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Give `hasExistingRegistrationForEmail` an optional client parameter

Change its signature so it can run against either the default `db` client or
a transaction client (`tx`), so the duplicate-email check happens inside the
same transaction as the capacity check and creates:

```ts
export async function hasExistingRegistrationForEmail(
  eventId: string,
  email: string,
  client: Pick<typeof db, "$queryRaw"> = db,
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  const result = await client.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM "Registration" r
      LEFT JOIN "User" u ON u.id = r."userId"
      WHERE r."eventId" = ${eventId}
        AND r."cancelledAt" IS NULL
        AND (
          LOWER(COALESCE(u.email, '')) = ${normalizedEmail}
          OR LOWER(COALESCE(r."formData"->>'email', '')) = ${normalizedEmail}
        )
    ) AS "exists"
  `;

  return Boolean(result[0]?.exists);
}
```

This keeps every existing external caller of `hasExistingRegistrationForEmail`
working unchanged (the new parameter defaults to `db`), while letting
`createRegistration` (step 2) pass its transaction client through.

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Wrap the capacity check, duplicate check, and both creates in one serializable transaction

Restructure `createRegistration` so everything from the capacity check
through the post-insert capacity-close update runs inside a single
`db.$transaction(async (tx) => { ... })` using Postgres `Serializable`
isolation, with `tx` replacing `db` for every call in that block. Keep the
initial `event` lookup, the email-sending calls, and the `return registration`
**outside** the transaction, exactly where they are now. Target shape:

```ts
export async function createRegistration(input: {
  amount: string;
  eventId: string;
  extraFormData?: Record<string, string>;
  locale: "ar" | "en";
  paymentMethod: "bank" | "card" | "free";
  registrantEmail: string;
  registrantName: string;
  userId?: string;
}) {
  const amountNumber = Number(input.amount || "0");
  const amount = Number.isFinite(amountNumber) ? amountNumber : 0;
  const event = await db.event.findUnique({
    include: {
      translations: {
        take: 1,
        where: { locale: input.locale },
      },
    },
    where: { id: input.eventId },
  });

  if (!event) {
    throw new Error("Event not found.");
  }
  if (!event.registrationsOpen) {
    throw new Error("Registrations are closed.");
  }
  if (event.registrationDeadline && event.registrationDeadline < new Date()) {
    throw new Error("Registration deadline passed.");
  }

  const registration = await db.$transaction(
    async (tx) => {
      if (event.capacity) {
        const currentCount = await tx.registration.count({ where: { eventId: event.id } });
        if (currentCount >= event.capacity) {
          await tx.event.update({
            data: { registrationsOpen: false },
            where: { id: event.id },
          });
          throw new Error("Event capacity reached.");
        }
      }

      if (await hasExistingRegistrationForEmail(input.eventId, input.registrantEmail, tx)) {
        throw new Error("A registration already exists for this email.");
      }

      const created = await tx.registration.create({
        data: {
          amount,
          eventId: input.eventId,
          formData: {
            email: input.registrantEmail,
            emailNormalized: input.registrantEmail.trim().toLowerCase(),
            locale: input.locale,
            name: input.registrantName,
            ...(input.extraFormData ?? {}),
          },
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === "free" ? "paid" : "pending",
          status: input.paymentMethod === "free" ? "confirmed" : "submitted",
          userId: input.userId ?? null,
        },
      });

      await tx.payment.create({
        data: {
          method: input.paymentMethod,
          registrationId: created.id,
          status: input.paymentMethod === "free" ? "paid" : "pending",
        },
      });

      if (event.capacity) {
        const total = await tx.registration.count({ where: { eventId: event.id } });
        if (total >= event.capacity && event.registrationsOpen) {
          await tx.event.update({
            data: { registrationsOpen: false },
            where: { id: event.id },
          });
        }
      }

      return created;
    },
    { isolation: "Serializable" },
  );

  const eventTitle = event?.translations[0]?.title ?? event?.slug ?? "Event";
  const mail = registrationConfirmationTemplate({
    eventTitle,
    locale: input.locale,
    registrantName: input.registrantName,
  });

  await sendEmail({ html: mail.html, subject: mail.subject, text: mail.text, to: input.registrantEmail });

  if (input.paymentMethod === "bank") {
    const pending = bankTransferPendingTemplate({
      eventTitle,
      locale: input.locale,
      registrantName: input.registrantName,
    });
    await sendEmail({
      html: pending.html,
      subject: pending.subject,
      text: pending.text,
      to: input.registrantEmail,
    });
  }

  return registration;
}
```

Notes on this exact shape:
- The `event.findUnique` no longer needs `registrations: { select: { id: true } }`
  since capacity is now checked with `tx.registration.count` inside the
  transaction — remove that `include` key (kept `translations` as-is).
- The transaction's isolation option name/casing must match whatever this
  Prisma version (`@prisma/client` 7.x per `package.json`) expects for
  `db.$transaction(fn, { isolation: ... })` — check
  `node_modules/.prisma/client/index.d.ts` or the Prisma docs bundled under
  `node_modules/next/dist/docs/` equivalent for Prisma if unsure of the exact
  literal type (it may be an enum import like
  `Prisma.TransactionIsolationLevel.Serializable` rather than the string
  `"Serializable"` — confirm the exact form the installed `@prisma/client`
  version expects and use that, adjusting the snippet above accordingly).
- Do not add a try/catch around the `db.$transaction(...)` call — the
  existing callers already handle (or rather, don't handle, by design of
  this plan being out-of-scope for that) thrown errors identically before and
  after this change.

**Verify**: `pnpm typecheck` → exit 0, no errors (this step exercises Prisma's transaction typings most heavily — pay attention to any type error naming the isolation level option).

### Step 3: Confirm no other caller of `hasExistingRegistrationForEmail` broke

**Verify**: `grep -rn "hasExistingRegistrationForEmail(" src --include=*.ts --include=*.tsx` → every call site either passes 2 arguments (uses the default `db` client, unaffected) or the 3-argument form added in step 2 (`tx`). Confirm none pass a 3rd argument that isn't `tx` from inside this file's own transaction.

## Test plan

No test suite exists in this repo (`pnpm test` is a no-op). Do not add a test
framework as part of this plan — that is a separate, larger initiative
(flagged in the audit as its own finding). Manual verification instead:

- Read through the restructured function once fully applied and confirm:
  capacity check → duplicate-email check → registration create → payment
  create → capacity-close update are all reached via `tx`, in that order,
  inside the transaction callback.
- Confirm `event.registrations` is no longer referenced anywhere in the
  function (the `include` was removed in step 2) —
  `grep -n "event.registrations" src/lib/registrations/service.ts` → no matches.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `grep -n "db.\$transaction" src/lib/registrations/service.ts` → 1 match
- [ ] `grep -n "event.registrations" src/lib/registrations/service.ts` → no matches
- [ ] `grep -n "client: Pick<typeof db" src/lib/registrations/service.ts` → 1 match
- [ ] No files outside `src/lib/registrations/service.ts` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `src/lib/registrations/service.ts` doesn't match the "Current state"
  excerpt (drift since this plan was written).
- The installed `@prisma/client` version's `$transaction` typings don't
  accept an `isolation` option in the shape assumed here — report the exact
  type error and the Prisma version instead of guessing an API.
- `pnpm typecheck` still fails after matching the isolation-level type
  exactly as the installed Prisma version expects.
- You find a third caller of `createRegistration` or
  `hasExistingRegistrationForEmail` not listed in this plan — report it
  before changing its behavior.

## Maintenance notes

- The two page-level callers of `createRegistration`
  (`src/app/[locale]/events/[slug]/register/page.tsx`,
  `src/app/[locale]/training-courses/[slug]/register/page.tsx`) still have no
  try/catch, so a serialization-conflict error (a legitimate, expected
  outcome under this plan when two people race for the last seat) will
  surface as an unhandled error page rather than a friendly "please try
  again" message to the registrant. That UX gap is real but out of scope
  here — flag it as a natural follow-up plan.
- If a future change adds a unique DB constraint on `(eventId, emailNormalized)`
  for duplicate-registration prevention, the in-transaction
  `hasExistingRegistrationForEmail` check here could be simplified to rely on
  the constraint (catching the unique-violation error) instead of a
  pre-check — not needed now, but worth revisiting if that constraint is ever
  added.
