# People Groups Implementation Plan

**Goal:** Independent bilingual groups with accessible drag-and-drop and matching public rendering while retaining legacy content.
**Architecture:** Ordered display metadata stores groups. Existing EventTrainer relations remain the unique member union. A shared pure module validates groups, derives legacy groups, resolves localized public groups and performs moves. Extract a focused editor and public renderer.
**Tech Stack:** Next.js 16, React 19, Zod, dnd-kit, Prisma, Vitest.

- [x] Add shared schemas, legacy/read helpers, ordered move helper, and focused Vitest coverage in src/lib/events/people-groups.ts and __tests__/people-groups.test.ts.
- [x] Add src/components/dashboard/people-groups-editor.tsx using existing UI components, locale context, pointer/keyboard sensors, group sorting, cross-group member moves, duplicate prevention, removal confirmation, and select/button alternatives.
- [x] Integrate peopleGroups into event form schema/defaults/health/errors, remove obsolete trainer picker code, load existing groups in dashboard/programs/[id]/page.tsx, and retain current agenda profile options.
- [x] Validate and persist metadata and relation union atomically in dashboard/events/_actions.ts. Preserve other metadata and existing IDs. Revalidate both locale detail routes.
- [x] Resolve groups in content/queries.ts and use shared src/components/events/people-groups.tsx on both public routes. Preserve old heading and member order via fallback.
- [x] Rename visible Trainers directory/sidebar/form language to People; retain dashboard URL. Document editing, compatibility and verification.
- [x] Run pnpm test:unit, pnpm test:event-form, pnpm typecheck and scoped lint. Render local desktop/mobile/RTL fixtures and verify drag, duplicate handling, persisted order and public groups.

Validation and implementation details: [People groups guide](../../features/people-groups.md). Spec/plan and final implementation received independent read-only review with no blocking findings.
