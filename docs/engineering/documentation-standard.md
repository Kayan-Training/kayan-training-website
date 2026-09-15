# Engineering Documentation Standard

## Purpose

This document defines how code-level documentation should be written in this repository.

## File Header Convention

Add a short header block at the top of each non-trivial source file that explains:

1. Why the file exists
2. Its responsibilities and boundaries
3. Any critical constraints or integration points

Example:

```ts
/**
 * Brief purpose statement.
 *
 * Responsibilities:
 * - ...
 * - ...
 */
```

## Inline Comments

Use comments sparingly and only when they add context not obvious from code.

Good uses:
- Security or auth assumptions
- Locale/RTL edge-case handling
- Data consistency constraints
- Non-obvious framework behavior

Avoid:
- Restating code line-by-line
- Redundant comments on simple assignments

## Production Rule of Thumb

- Trivial UI leaf components may skip file headers.
- Core infrastructure files (`proxy`, `auth`, `db`, service modules, route handlers) should always include headers.
- Public APIs/functions should have clear names and narrow responsibilities; prefer readable code over excessive comments.
