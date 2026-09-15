# Event Form Audit (Accessibility + Performance)
Date: 2026-05-13  
Scope: `src/app/[locale]/dashboard/events/_components/event-form.tsx` (left rail, main panel, right rail)

## Method
- Static code audit of the current implementation.
- No runtime browser instrumentation was used in this pass.
- Findings are prioritized by impact and implementation risk.

## Scorecard
| Dimension | Score (0-4) | Notes |
|---|---:|---|
| Accessibility | 2 | Basic labels and button semantics are present, but tab semantics/announcements and keyboard edge cases need work. |
| Performance | 2 | Good use of memoization and extracted logic; still heavy `form.watch(...)` usage and a very large component tree. |
| Responsive | 3 | Major shell adaptation is implemented for mobile/tablet/desktop. |
| Theming | 2 | Mostly hardcoded utility colors; limited token abstraction. |
| Anti-Pattern Risk | 3 | Form is purposeful and dense; still some cognitive overload in large mixed sections. |

## P1 Findings
1. Missing explicit active-state semantics in section rail  
Location: left rail buttons in `event-form.tsx`  
Impact: Screen-reader users may not be told which section is active.  
Recommendation: Add `aria-current="page"` (or `aria-pressed`) on active section button, and include `aria-controls` pointing to active panel.

2. Error summary not announced as live region  
Location: submit error toast and diagnostics  
Impact: Users relying on assistive tech may miss form-level validation context.  
Recommendation: Add a dedicated inline error summary region with `role="alert"` and links to sections/fields.

3. Very large client component with broad reactive surface  
Location: whole `event-form.tsx`  
Impact: Increased re-render pressure and maintenance risk as behavior grows.  
Recommendation: Split into section components and pass narrowed props from a shared model layer.

## P2 Findings
1. Repeated `form.watch(...)` in render paths  
Impact: increases render churn and makes update behavior less predictable.  
Recommendation: Consolidate into `useWatch` groups or selectors where possible.

2. Dense interactive clusters in rails  
Impact: keyboard traversal can become fatiguing.  
Recommendation: add optional “compact/expanded” rail modes and section shortcuts.

3. Table responsiveness relies on horizontal scroll only  
Location: registrations table  
Impact: usable but suboptimal on very narrow screens.  
Recommendation: add row-card fallback at small breakpoints.

## P3 Findings
1. Motion tokens not centralized  
Recommendation: define shared timing/easing constants for transitions.

2. Color tokenization is partial  
Recommendation: move repeated rail/state colors into semantic variables.

## Completed Since Previous Pass
- Gallery isolated into dedicated section.
- Visibility/sidebar logic extracted into pure helpers + matrix tests.
- Section health/readiness extracted + matrix tests.
- Left rail grouped with progress and section status chips.
- Right rail diagnostics card added.
- Context-aware right rail groups.
- Reduced-motion-aware section transition wrapper.

## Recommended Next Actions
1. Add rail and panel accessibility semantics (`aria-current`, `aria-controls`, labelled section panel).
2. Introduce inline alert summary for validation errors (in addition to toast).
3. Split `event-form.tsx` into per-section components (`IdentitySection`, `PricingSection`, etc.) and shared hooks for state slices.
4. Add UI behavior tests for conditional rendering + active-section semantics in a component test framework.
