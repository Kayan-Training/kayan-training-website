# Dashboard UI/UX Audit And Implementation Plan

Date: 2026-05-05  
Scope: `src/app/[locale]/dashboard/**` and shared dashboard components.

## Method

This audit applies the requested skill set as a combined framework:
- `critique` + `audit`: issue discovery and severity rating.
- `impeccable`, `layout`, `typeset`, `adapt`, `clarify`, `distill`: structural and content quality.
- `delight`, `colorize`, `frontend-design`: interaction and visual polish.
- `playwright`: validation workflow (to run per phase).
- `overdrive`: intentionally deferred for selective high-impact surfaces only.

## Findings (Prioritized)

## P0 - Must Fix

1. Inconsistent layout foundation across dashboard routes
- Evidence: page-level wrappers vary; shell-level width/padding was not authoritative.
- Impact: visual drift, hard-to-maintain spacing rhythm, inconsistent responsive behavior.
- Status: partially fixed by standardizing shell container to `max-w-6xl` in dashboard layout.

2. No consolidated UX contract for action controls
- Evidence: mixed icon-only/text-only patterns and inconsistent destructive affordance.
- Impact: poor scannability and unsafe action confidence.
- Status: partially addressed in events/posts/users/registrations/categories/menus; still needs full sweep for all editors and subcomponents.

## P1 - High Impact

1. Form architecture inconsistent in deeper editors
- Evidence: some editors still use ad hoc label/input/button groupings instead of uniform field primitives.
- Impact: vertical rhythm and cognitive load increase in long forms.
- Recommendation: introduce shared dashboard field rows and section templates; remove one-off inline control styles.

2. Sticky behavior not consistent where editing depth is high
- Evidence: long editors (pages/events) have partial sticky patterns but not fully standardized for header/actions and side context rails.
- Impact: users lose save/status controls while scrolling.
- Recommendation: unified sticky top action bar contract with scroll-safe offsets.

3. CTA/button style system in block editors still fragmented
- Evidence: improvements landed for selector behavior, but component-level API and visuals differ by location.
- Impact: user learns multiple interaction models for equivalent actions.
- Recommendation: central `ActionSelector` and `InlineActionGroup` components.

## P2 - Medium

1. Table utility parity gaps
- Evidence: filter/empty/loading/action states differ between modules.
- Recommendation: shared table header/filter toolbar and empty-state primitives.

2. Microcopy consistency gaps
- Evidence: mixed verb styles (`Add`, `New`, `Create`) and inconsistent helper text tone.
- Recommendation: copy normalization pass by intent taxonomy.

3. Locale parity and truncation handling
- Evidence: some EN/AR label treatment still differs in compact action zones.
- Recommendation: apply systematic truncation and tooltip rules for bilingual labels.

## P3 - Nice To Have

1. Visual hierarchy polish for secondary metadata
- Evidence: some areas still rely on low-contrast micro text without clear grouping.
- Recommendation: minor type scale/weight adjustments and spacing tokens.

2. Motion consistency
- Evidence: hover/focus transitions vary by module.
- Recommendation: a small motion token set for all dashboard interactive controls.

## Implementation Plan

## Phase 1 - Foundation (Now)

- Standardize shell width/padding/text token behavior.
- Normalize page headers to top-level non-card structure.
- Ensure primary action placement is consistent (title row right side).
- Enforce text+icon rules for destructive and create/edit actions.

Acceptance:
- Every dashboard route renders within `max-w-6xl`.
- Header rows are visually consistent and non-card by default.
- No ambiguous destructive labels (e.g., `Del`).

## Phase 2 - Editor Systemization

- Build shared primitives:
  - `DashboardFormSection`
  - `DashboardFieldRow`
  - `InlineActionSelector` (Primary/Secondary/etc.)
- Refactor pages/events/posts/settings forms to shared primitives.
- Standardize sticky header/action behavior.

Acceptance:
- Long forms maintain action availability while scrolling.
- Equivalent controls look and behave the same across editors.

## Phase 3 - Data Surfaces

- Unify table toolbar/filter/action architecture.
- Normalize empty/loading/error UX patterns.
- Add consistent export, bulk-action, and destructive confirmation affordances.

Acceptance:
- Table pages share one interaction model.
- Action controls and feedback patterns are predictable.

## Phase 4 - Quality Gates

- Run Playwright regression suite on dashboard key flows.
- Accessibility sweep (keyboard order, focus visibility, labels, dialog semantics).
- Final copy/style normalization pass.

Acceptance:
- No critical flow regressions.
- Keyboard and screen-reader critical paths pass.

## Immediate Next Work Queue

1. Apply Phase 1 header/action standard to any remaining outlier routes/subpages.
2. Start Phase 2 by extracting shared field/section primitives from page + event editors.
3. Follow with table-toolbar consolidation in users/registrations/posts/events.
