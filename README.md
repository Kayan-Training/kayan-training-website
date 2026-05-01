# Kayan Training & Consulting Platform

This repository hosts the production rewrite of the Kayan platform using Next.js 16.

## Package manager

Use `pnpm` for all commands in this codebase.

## Quick start

```bash
pnpm install
pnpm dev
```

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Prisma commands

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

## Environment setup

Copy `.env.example` to `.env` and fill in values before using auth/database/media features.
